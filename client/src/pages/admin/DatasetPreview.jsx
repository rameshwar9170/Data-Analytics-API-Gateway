import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Database,
  ArrowLeft,
  FileQuestion,
  Layers,
  Network,
  AlertCircle,
  FileText,
  Table as TableIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const DatasetPreview = () => {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'relationships' | 'quality'
  const [selectedCol, setSelectedCol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dsRes, prevRes, qualRes] = await Promise.all([
          api.get(`/datasets/${id}`),
          api.get(`/datasets/${id}/preview`),
          api.get(`/datasets/${id}/quality`),
        ]);

        setDataset(dsRes.data.dataset);
        setPreviewData(prevRes.data.preview);
        setQualityReport(qualRes.data);

        const colKeys = Object.keys(prevRes.data.preview || {});
        if (colKeys.length > 0) {
          setSelectedCol(colKeys[0]);
        }
      } catch (err) {
        toast.error('Failed to load dataset preview');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner text="Fetching Atlas dataset preview..." />;
  if (!dataset) return <p className="text-center py-12 text-sm text-gray-500">Dataset not found</p>;

  return (
    <div className="space-y-6">
      <Header
        title={dataset.name}
        subtitle={`${dataset.industry} • Database: ${dataset.databaseName} • ${(dataset.totalRecords || 0).toLocaleString()} stored records`}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/datasets">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back
              </Button>
            </Link>
            <Link to={`/admin/assignments?datasetId=${dataset._id}`}>
              <Button size="sm" icon={FileQuestion}>
                Generate Assignments
              </Button>
            </Link>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'data'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Collection Documents
        </button>

        <button
          onClick={() => setActiveTab('relationships')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'relationships'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Network className="h-4 w-4" />
          Schema Relationships
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'quality'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Data Quality & Anomalies Report
        </button>
      </div>

      {/* Tab: Data Preview */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Collection Selector Tabs */}
          <div className="md:col-span-3 space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Collections</p>
            {dataset.collections?.map((col) => {
              const isSelected = selectedCol === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setSelectedCol(col.name)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#E96A1C] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-mono">{col.name}</span>
                  <span className="text-[11px] opacity-80">{(col.recordCount || 0).toLocaleString()}</span>
                </button>
              );
            })}
          </div>

          {/* Sample records */}
          <div className="md:col-span-9 space-y-3">
            <Card
              title={`Sample Documents: ${selectedCol}`}
              subtitle="First 10 sample records directly retrieved from Atlas"
            >
              {previewData?.[selectedCol]?.sample?.length > 0 ? (
                <div className="space-y-3 max-h-[550px] overflow-y-auto">
                  {previewData[selectedCol].sample.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-[11px] overflow-x-auto"
                    >
                      <pre className="whitespace-pre-wrap">{JSON.stringify(doc, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">No preview records stored in this collection yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Relationships */}
      {activeTab === 'relationships' && (
        <Card title="Interconnected Relationships" subtitle="Foreign key references and referential mappings">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead>
                <tr className="text-gray-400 uppercase font-semibold">
                  <th className="pb-3">Source Collection</th>
                  <th className="pb-3">Field Reference</th>
                  <th className="pb-3">Target Collection</th>
                  <th className="pb-3">Relationship Cardinality</th>
                  <th className="pb-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataset.relationships?.map((rel, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-3 font-mono font-bold text-[#1B1D21]">{rel.from}</td>
                    <td className="py-3 font-mono text-[#E96A1C]">{rel.field || 'referenceId'}</td>
                    <td className="py-3 font-mono font-bold text-gray-700">{rel.to}</td>
                    <td className="py-3">
                      <Badge variant="info">{rel.type}</Badge>
                    </td>
                    <td className="py-3 text-gray-500">{rel.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Data Quality Report */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <Card title="Data Quality Engineering Audit" subtitle="Documented realistic anomalies injected for data analyst challenge">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-600">Configured Issue Rate</p>
                <p className="text-xl font-bold text-[#E96A1C] mt-1">{qualityReport?.qualityIssuePercentage || 5}%</p>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-600">Missing Values Injected</p>
                <p className="text-xl font-bold text-amber-700 mt-1">~{qualityReport?.qualitySummary?.missingValuesPercentage || 5}%</p>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-600">Duplicate Key Attempts</p>
                <p className="text-xl font-bold text-rose-700 mt-1">{(qualityReport?.qualitySummary?.duplicateRecordsCount || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-600">Outlier / Edge Values</p>
                <p className="text-xl font-bold text-purple-700 mt-1">{(qualityReport?.qualitySummary?.outliersCount || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Documented Anomalies</h4>
              <ul className="space-y-2 text-xs text-gray-700">
                {qualityReport?.anomaliesConfigured?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E96A1C] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DatasetPreview;
