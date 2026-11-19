import React, { useEffect, useState, useMemo } from 'react';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  Database,
  Layers,
  FileCode2,
  Table as TableIcon,
  Search,
  Key,
  Hash,
  ChevronRight,
  Info,
  Copy,
  Check,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Code2,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Helper: Syntax Highlighting for JSON in UI
const SyntaxHighlightedJson = ({ data }) => {
  const jsonString = JSON.stringify(data, null, 2);

  // Tokenize and colorize JSON
  const colorized = useMemo(() => {
    if (!jsonString) return '';
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-amber-600'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-700 font-semibold'; // key
          } else {
            cls = 'text-emerald-700'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-600 font-semibold'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-gray-400 italic'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [jsonString]);

  return (
    <pre
      className="font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap select-text"
      dangerouslySetInnerHTML={{ __html: colorized }}
    />
  );
};

export const DatabaseExplorer = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [schemaStats, setSchemaStats] = useState(null);
  const [indexes, setIndexes] = useState([]);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'schema' | 'indexes'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'json' | 'cards'
  const [collectionSearch, setCollectionSearch] = useState('');

  // Query filter & pagination
  const [filterQuery, setFilterQuery] = useState('{}');
  const [sortQuery, setSortQuery] = useState('{ "_id": -1 }');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector modal
  const [inspectedDoc, setInspectedDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 1. Fetch Databases
  useEffect(() => {
    const fetchDbs = async () => {
      try {
        const res = await api.get('/databases');
        const dbs = res.data.databases || [];
        setDatabases(dbs);

        // Auto-select first dataset DB or first DB
        const datasetDb = dbs.find((d) => d.isDatasetDb) || dbs[0];
        if (datasetDb) {
          handleSelectDatabase(datasetDb.name);
        }
      } catch (err) {
        toast.error('Failed to connect to MongoDB Atlas');
      } finally {
        setLoadingDbs(false);
      }
    };
    fetchDbs();
  }, []);

  // 2. Select Database & Fetch Collections
  const handleSelectDatabase = async (dbName) => {
    setSelectedDb(dbName);
    setSelectedCol(null);
    setDocuments([]);
    try {
      const res = await api.get(`/databases/${dbName}/collections`);
      const cols = res.data.collections || [];
      setCollections(cols);
      if (cols.length > 0) {
        handleSelectCollection(dbName, cols[0].name);
      }
    } catch (err) {
      toast.error('Failed to list collections');
    }
  };

  // 3. Select Collection & Fetch Data + Schema + Indexes
  const handleSelectCollection = async (
    dbName,
    colName,
    queryFilter = '{}',
    querySort = '{ "_id": -1 }',
    pageNum = 1,
    pageLimit = limit
  ) => {
    setSelectedCol(colName);
    setLoadingDocs(true);
    setPage(pageNum);

    try {
      const [docsRes, schemaRes, indexRes] = await Promise.all([
        api.get(`/databases/${dbName}/${colName}/documents`, {
          params: { filter: queryFilter, sort: querySort, page: pageNum, limit: pageLimit },
        }),
        api.get(`/databases/${dbName}/${colName}/schema`),
        api.get(`/databases/${dbName}/${colName}/indexes`),
      ]);

      setDocuments(docsRes.data.documents || []);
      setTotalCount(docsRes.data.total || 0);
      setSchemaStats(schemaRes.data.stats || null);
      setIndexes(indexRes.data.indexes || []);
    } catch (err) {
      toast.error('Failed to load collection data from Atlas');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    if (!selectedDb || !selectedCol) return;
    try {
      JSON.parse(filterQuery);
      if (sortQuery) JSON.parse(sortQuery);
    } catch (err) {
      toast.error('Invalid JSON filter or sort syntax. Please check formatting.');
      return;
    }
    handleSelectCollection(selectedDb, selectedCol, filterQuery, sortQuery, 1, limit);
  };

  const handleResetFilter = () => {
    setFilterQuery('{}');
    setSortQuery('{ "_id": -1 }');
    if (selectedDb && selectedCol) {
      handleSelectCollection(selectedDb, selectedCol, '{}', '{ "_id": -1 }', 1, limit);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive unique column keys from current documents for Table View
  const tableColumns = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    const colSet = new Set();
    colSet.add('_id');
    documents.forEach((doc) => {
      Object.keys(doc).forEach((k) => {
        if (colSet.size < 9) colSet.add(k); // Show up to 9 primary columns
      });
    });
    return Array.from(colSet);
  }, [documents]);

  // Filter collections by search term
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return collections;
    return collections.filter((c) =>
      c.name.toLowerCase().includes(collectionSearch.trim().toLowerCase())
    );
  }, [collections, collectionSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Header
        title="MongoDB Database Explorer"
        subtitle="Real-time document inspector, schema analyzer, and index viewer directly on Atlas"
      />

      {/* Main Grid: Left Navigation & Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Databases & Collections Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          {/* Databases Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-3.5">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#E96A1C]" /> Atlas Databases
              </span>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {databases.length}
              </span>
            </div>

            {loadingDbs ? (
              <div className="py-6">
                <LoadingSpinner size="sm" text="Scanning Atlas..." />
              </div>
            ) : (
              <div className="space-y-1">
                {databases.map((db) => {
                  const isSelected = selectedDb === db.name;
                  return (
                    <button
                      key={db.name}
                      onClick={() => handleSelectDatabase(db.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#E96A1C] text-white shadow-sm ring-1 ring-[#E96A1C]'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Database className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        <span className="truncate">{db.name}</span>
                      </div>
                      {db.isDatasetDb && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E96A1C]'
                          }`}
                        >
                          Dataset
                        </span>
                      )}
                      {db.isSystem && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          System
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collections Section */}
          {selectedDb && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-3.5">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#F4A261]" /> Collections
                </span>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {collections.length}
                </span>
              </div>

              {/* Collection search filter */}
              {collections.length > 5 && (
                <div className="relative mb-2">
                  <Search className="h-3 w-3 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    placeholder="Search collections..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#E96A1C] focus:bg-white transition-all"
                  />
                </div>
              )}

              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {filteredCollections.map((col) => {
                  const isSelected = selectedCol === col.name;
                  return (
                    <button
                      key={col.name}
                      onClick={() => handleSelectCollection(selectedDb, col.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-[#1B1D21] text-white font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers
                          className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[#F4A261]' : 'text-gray-400'}`}
                        />
                        <span className="truncate">{col.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {(col.count || 0).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Main Data & Schema Panel */}
        <div className="lg:col-span-9 space-y-4">
          {selectedCol ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header Bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collection</span>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-mono text-xs font-bold text-[#1B1D21]">
                    <span className="text-gray-400">{selectedDb}.</span>
                    <span className="text-[#E96A1C]">{selectedCol}</span>
                  </div>
                  <Badge variant="orange" size="sm">
                    {totalCount.toLocaleString()} documents
                  </Badge>
                </div>

                {/* Primary Mode Tabs (Documents / Schema / Indexes) */}
                <div className="flex items-center bg-gray-200/70 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      activeTab === 'data'
                        ? 'bg-white text-[#1B1D21] font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    Documents
                  </button>
                  <button
                    onClick={() => setActiveTab('schema')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      activeTab === 'schema'
                        ? 'bg-white text-[#1B1D21] font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Schema & Fields
                  </button>
                  <button
                    onClick={() => setActiveTab('indexes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      activeTab === 'indexes'
                        ? 'bg-white text-[#1B1D21] font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Indexes ({indexes.length})
                  </button>
                </div>
              </div>

              {/* Sub-toolbar when in "Documents" Tab */}
              {activeTab === 'data' && (
                <div className="p-4 border-b border-gray-200 bg-white space-y-3">
                  {/* Query Bar */}
                  <form onSubmit={handleApplyFilter} className="flex flex-col md:flex-row items-stretch gap-2.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">filter</span>
                      </div>
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder='{ "status": "active" }'
                        className="w-full pl-16 pr-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                    <div className="relative md:w-56">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">sort</span>
                      </div>
                      <input
                        type="text"
                        value={sortQuery}
                        onChange={(e) => setSortQuery(e.target.value)}
                        placeholder='{ "_id": -1 }'
                        className="w-full pl-14 pr-3 py-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" type="submit" variant="primary" className="gap-1.5 px-4 font-semibold">
                        <Search className="h-3.5 w-3.5" /> Find
                      </Button>
                      <Button size="sm" type="button" variant="outline" onClick={handleResetFilter} title="Reset Filter">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>

                  {/* View Mode Switcher (Table / JSON / Cards) */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>View as:</span>
                      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            viewMode === 'table' ? 'bg-white text-[#1B1D21] font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <TableIcon className="h-3 w-3" /> Table
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('json')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            viewMode === 'json' ? 'bg-white text-[#1B1D21] font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Code2 className="h-3 w-3" /> JSON Tree
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('cards')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            viewMode === 'cards' ? 'bg-white text-[#1B1D21] font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <LayoutGrid className="h-3 w-3" /> Cards
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Page size:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          const newLimit = parseInt(e.target.value, 10);
                          setLimit(newLimit);
                          handleSelectCollection(selectedDb, selectedCol, filterQuery, sortQuery, 1, newLimit);
                        }}
                        className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none font-medium"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Body */}
              <div className="p-4 flex-1">
                {loadingDocs ? (
                  <div className="py-20">
                    <LoadingSpinner text="Reading documents directly from MongoDB Atlas..." />
                  </div>
                ) : activeTab === 'data' ? (
                  /* Documents Tab */
                  <div>
                    {documents.length === 0 ? (
                      <div className="py-16 text-center">
                        <Database className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700">No documents found</p>
                        <p className="text-xs text-gray-400 mt-1">Try clearing your filter or selecting another collection</p>
                        <Button size="sm" variant="outline" onClick={handleResetFilter} className="mt-4">
                          Clear Filter
                        </Button>
                      </div>
                    ) : viewMode === 'table' ? (
                      /* 1. TABLE VIEW */
                      <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-2xs">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs font-mono">
                          <thead className="bg-gray-100/80">
                            <tr>
                              <th className="py-2.5 px-3 font-bold text-gray-600 tracking-wider w-12 text-center">#</th>
                              {tableColumns.map((col) => (
                                <th key={col} className="py-2.5 px-3 font-bold text-[#1B1D21] tracking-wider whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                              <th className="py-2.5 px-3 font-bold text-gray-600 text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {documents.map((doc, idx) => {
                              const docId = doc._id?.toString() || idx;
                              return (
                                <tr key={docId} className="hover:bg-orange-50/40 transition-colors group">
                                  <td className="py-2 px-3 text-center text-gray-400 text-[10px]">
                                    {(page - 1) * limit + idx + 1}
                                  </td>
                                  {tableColumns.map((colKey) => {
                                    const val = doc[colKey];
                                    let renderedVal;
                                    if (val === undefined || val === null) {
                                      renderedVal = <span className="text-gray-300 italic">null</span>;
                                    } else if (typeof val === 'boolean') {
                                      renderedVal = (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {val ? 'true' : 'false'}
                                        </span>
                                      );
                                    } else if (typeof val === 'number') {
                                      renderedVal = <span className="text-amber-700 font-medium">{val.toLocaleString()}</span>;
                                    } else if (typeof val === 'object') {
                                      renderedVal = (
                                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                                          {Array.isArray(val) ? `[${val.length}]` : '{...}'}
                                        </span>
                                      );
                                    } else if (colKey === '_id') {
                                      renderedVal = (
                                        <span className="text-purple-700 font-semibold cursor-pointer hover:underline" onClick={() => handleCopyText(val, docId)}>
                                          {String(val).slice(0, 10)}...
                                        </span>
                                      );
                                    } else if (colKey === 'status') {
                                      const isPos = ['active', 'completed', 'paid', 'verified'].includes(String(val).toLowerCase());
                                      const isNeg = ['failed', 'defaulted', 'cancelled', 'inactive'].includes(String(val).toLowerCase());
                                      renderedVal = (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                          isPos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isNeg ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                          {String(val)}
                                        </span>
                                      );
                                    } else {
                                      renderedVal = <span className="text-gray-800 truncate max-w-xs block">{String(val)}</span>;
                                    }

                                    return (
                                      <td key={colKey} className="py-2 px-3 whitespace-nowrap">
                                        {renderedVal}
                                      </td>
                                    );
                                  })}
                                  <td className="py-2 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setInspectedDoc(doc)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-[#E96A1C] transition-colors"
                                        title="View Full Document"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleCopyText(doc, docId)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-emerald-600 transition-colors"
                                        title="Copy JSON"
                                      >
                                        {copiedId === docId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : viewMode === 'json' ? (
                      /* 2. SYNTAX HIGHLIGHTED JSON TREE VIEW */
                      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                        {documents.map((doc, idx) => {
                          const docId = doc._id?.toString() || idx;
                          return (
                            <div
                              key={docId}
                              className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-all shadow-2xs relative group"
                            >
                              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleCopyText(doc, docId)}
                                  className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-[11px] font-sans font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                                >
                                  {copiedId === docId ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <SyntaxHighlightedJson data={doc} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* 3. CARD VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                        {documents.map((doc, idx) => {
                          const docId = doc._id?.toString() || idx;
                          return (
                            <div
                              key={docId}
                              className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#E96A1C]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                                  <span className="font-mono text-xs font-bold text-purple-700 truncate">
                                    {String(doc._id || `#${idx + 1}`)}
                                  </span>
                                  <button
                                    onClick={() => handleCopyText(doc, docId)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#E96A1C]"
                                    title="Copy JSON"
                                  >
                                    {copiedId === docId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                                <div className="space-y-1.5 font-mono text-xs">
                                  {Object.entries(doc)
                                    .slice(0, 6)
                                    .map(([k, v]) => (
                                      <div key={k} className="flex items-baseline justify-between gap-2">
                                        <span className="text-gray-400 font-sans text-[11px]">{k}:</span>
                                        <span className="text-gray-800 truncate font-semibold text-right max-w-[180px]">
                                          {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                              <button
                                onClick={() => setInspectedDoc(doc)}
                                className="mt-3 pt-2 border-t border-gray-100 text-xs text-[#E96A1C] hover:underline font-semibold flex items-center justify-center gap-1 w-full text-center"
                              >
                                View full document <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200 text-xs text-gray-500">
                      <div>
                        Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> to{' '}
                        <span className="font-semibold text-gray-900">
                          {Math.min(page * limit, totalCount)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span> records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page <= 1}
                          onClick={() => handleSelectCollection(selectedDb, selectedCol, filterQuery, sortQuery, page - 1, limit)}
                        >
                          Previous
                        </Button>
                        <span className="px-2 font-semibold text-[#1B1D21]">Page {page}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page * limit >= totalCount}
                          onClick={() => handleSelectCollection(selectedDb, selectedCol, filterQuery, sortQuery, page + 1, limit)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'schema' ? (
                  /* 2. SCHEMA & FIELDS TAB */
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800">
                      <Info className="h-4 w-4 shrink-0 text-blue-600" />
                      <span>Inferred schema and field types automatically generated by analyzing document distributions on Atlas.</span>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-2xs">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-xs font-mono">
                        <thead className="bg-gray-100/80">
                          <tr>
                            <th className="py-2.5 px-4 font-bold text-[#1B1D21]">Field Name</th>
                            <th className="py-2.5 px-4 font-bold text-[#1B1D21]">BSON / Data Type</th>
                            <th className="py-2.5 px-4 font-bold text-[#1B1D21]">Sample Value from Atlas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {schemaStats?.fields?.map((field) => (
                            <tr key={field} className="hover:bg-gray-50/70 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-[#1B1D21] flex items-center gap-1.5">
                                <Hash className="h-3 w-3 text-[#E96A1C]" /> {field}
                              </td>
                              <td className="py-2.5 px-4">
                                <Badge variant="info" size="sm">
                                  {schemaStats.fieldTypes[field] || 'mixed'}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-gray-700 truncate max-w-md">
                                {JSON.stringify(schemaStats.sample?.[0]?.[field])}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* 3. INDEXES TAB */
                  <div className="space-y-4">
                    <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-lg flex items-center gap-2 text-xs text-orange-800">
                      <Key className="h-4 w-4 shrink-0 text-[#E96A1C]" />
                      <span>Active MongoDB indexes created on Atlas cluster for high-throughput candidate evaluation.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {indexes.map((idx, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-[#E96A1C]" />
                              <span className="font-mono font-bold text-xs text-[#1B1D21]">{idx.name}</span>
                            </div>
                            {idx.unique && <Badge variant="warning" size="sm">Unique</Badge>}
                          </div>
                          <div className="font-mono text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                            {JSON.stringify(idx.key, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1B1D21]">Select a Database and Collection</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Choose one of your verified MongoDB Atlas databases on the left to inspect documents, schemas, and indexing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Document Modal */}
      {inspectedDoc && (
        <Modal
          isOpen={!!inspectedDoc}
          onClose={() => setInspectedDoc(null)}
          title={`Document Inspector — ${inspectedDoc._id || 'Record'}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="font-mono text-xs text-gray-600">
                Collection: <span className="font-bold text-[#1B1D21]">{selectedDb}.{selectedCol}</span>
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleCopyText(inspectedDoc, inspectedDoc._id || 'modal')}
              >
                {copiedId === (inspectedDoc._id || 'modal') ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied JSON
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy JSON
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto max-h-[500px]">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(inspectedDoc, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DatabaseExplorer;
