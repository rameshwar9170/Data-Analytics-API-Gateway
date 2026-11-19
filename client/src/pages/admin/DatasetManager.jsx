import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import {
  Database,
  Eye,
  RefreshCw,
  Trash2,
  FileQuestion,
  Search,
  Filter,
  Plus,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const DatasetManager = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (industryFilter) params.industry = industryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/datasets', { params });
      setDatasets(res.data.datasets || []);
    } catch (err) {
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [industryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDatasets();
  };

  const handleRegenerate = async (id) => {
    try {
      await api.post(`/datasets/${id}/regenerate`);
      toast.success('Regeneration triggered on Atlas');
      fetchDatasets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/datasets/${deleteTarget._id}`);
      toast.success(`Dataset and database '${deleteTarget.databaseName}' deleted`);
      setDeleteTarget(null);
      fetchDatasets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete dataset');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Dataset Manager"
        subtitle="Inspect, preview, regenerate, and manage realistic Atlas databases"
        actions={
          <Link to="/admin/generator">
            <Button icon={Plus}>Generate New Dataset</Button>
          </Link>
        }
      />

      {/* Filters and search */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search datasets by name or database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="text-xs p-1.5 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">All Industries</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="College / University ERP">College ERP</option>
              <option value="Hospital Management">Hospital</option>
              <option value="CRM and Sales">CRM & Sales</option>
              <option value="Banking and Finance">Banking & Finance</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
            </select>

            <Button size="sm" type="submit" variant="secondary">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Datasets Table */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading Atlas datasets..." />
        ) : datasets.length === 0 ? (
          <EmptyState
            title="No datasets found"
            description="Generate a realistic dataset for E-Commerce, Hospital, College ERP, CRM, or Banking."
            icon={Database}
            action={
              <Link to="/admin/generator">
                <Button size="sm">Generate Dataset</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead>
                <tr className="text-gray-400 uppercase font-semibold">
                  <th className="pb-3">Dataset Name</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Atlas Database</th>
                  <th className="pb-3">Collections</th>
                  <th className="pb-3">Total Records</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {datasets.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50/60">
                    <td className="py-3.5">
                      <p className="font-bold text-[#1B1D21]">{d.name}</p>
                      <p className="text-[11px] text-gray-500">{d.difficulty} • {new Date(d.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3.5 text-gray-600">{d.industry}</td>
                    <td className="py-3.5 font-mono text-[11px] text-[#E96A1C]">{d.databaseName}</td>
                    <td className="py-3.5 text-gray-700 font-medium">{d.collections?.length || 0} collections</td>
                    <td className="py-3.5 font-bold text-gray-900">{(d.totalRecords || 0).toLocaleString()}</td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          d.generationStatus === 'completed'
                            ? 'success'
                            : d.generationStatus === 'generating'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {d.generationStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/preview/${d._id}`}>
                          <button
                            title="Preview Records & Schema"
                            className="p-1.5 text-gray-500 hover:text-[#E96A1C] hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>

                        <button
                          title="Regenerate on Atlas"
                          onClick={() => handleRegenerate(d._id)}
                          className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>

                        <button
                          title="Delete Dataset"
                          onClick={() => setDeleteTarget(d)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Modal for Database Deletion */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Dataset & Database Deletion"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete Database on Atlas
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-xs">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>
              Warning: Deleting <strong>{deleteTarget?.name}</strong> will also completely drop the MongoDB Atlas database{' '}
              <code className="font-mono font-bold">{deleteTarget?.databaseName}</code>.
            </p>
          </div>
          <p className="text-xs text-gray-600">
            This action is irreversible. All records, collections, and indexes in this database namespace will be dropped.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default DatasetManager;
