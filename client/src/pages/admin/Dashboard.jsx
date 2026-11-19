import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Database,
  Users,
  Activity,
  FileCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Server,
  Layers,
  Compass,
} from 'lucide-react';
import api from '../../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, datasetsRes] = await Promise.all([
          api.get('/monitor/stats'),
          api.get('/datasets?limit=5'),
        ]);
        setStats(statsRes.data.stats);
        setRecentDatasets(datasetsRes.data.datasets || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />;

  return (
    <div className="space-y-6">
      <Header
        title="Admin Overview"
        subtitle="Manage synthetic datasets, assessment pipelines, and real-time candidate evaluations"
        actions={
          <Link to="/admin/generator">
            <Button icon={Sparkles}>New AI Dataset</Button>
          </Link>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Datasets</span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E96A1C]">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1B1D21] mt-3 tracking-tight">{stats?.totalDatasets || 0}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
            <Server className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-medium text-gray-600">{(stats?.totalRecordsGenerated || 0).toLocaleString()} stored records</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Assessments</span>
            <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1B1D21] mt-3 tracking-tight">{stats?.activeAssessments || 0}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
            <span className="font-medium text-gray-600">{stats?.completedAssessments || 0} completed &amp; graded</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Candidates</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1B1D21] mt-3 tracking-tight">{stats?.totalCandidates || 0}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
            <span className="font-medium text-gray-600">Enrolled analysts</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Queries Executed</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#1B1D21] mt-3 tracking-tight">{(stats?.totalQueriesExecuted || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{stats?.successRate || 100}% query success rate</span>
          </div>
        </div>
      </div>

      {/* Datasets Table & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Generated Datasets on Atlas"
            subtitle="Recent database namespaces and verified collection counts"
            noPadding
            action={
              <Link to="/admin/datasets" className="text-xs font-semibold text-[#E96A1C] hover:text-[#d45a0c] flex items-center gap-1 transition-colors">
                View all datasets <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {recentDatasets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-gray-500">No datasets generated yet.</p>
                <Link to="/admin/generator" className="mt-3 inline-block">
                  <Button size="sm">Generate First Dataset</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="px-6 py-3.5">Dataset Name</th>
                      <th className="px-4 py-3.5">Industry</th>
                      <th className="px-4 py-3.5">Atlas Database</th>
                      <th className="px-4 py-3.5 text-right">Records</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentDatasets.map((d) => (
                      <tr key={d._id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#1B1D21] max-w-xs truncate">
                          <Link to={`/admin/datasets/${d._id}`} className="hover:text-[#E96A1C] transition-colors">
                            {d.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                            {d.industry}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-[11px] px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700">
                            {d.databaseName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-gray-800">
                          {(d.totalRecords || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={d.generationStatus === 'completed' ? 'success' : d.generationStatus === 'generating' ? 'warning' : 'danger'}>
                            {d.generationStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            to={`/admin/explorer?database=${d.databaseName}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#E96A1C] transition-colors"
                            title="Explore database collections"
                          >
                            <Compass className="h-3.5 w-3.5" />
                            <span>Explore</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Workflows Panel */}
        <div>
          <Card title="Quick Workflows" subtitle="Streamlined actions for evaluation pipelines">
            <div className="space-y-3">
              <Link
                to="/admin/generator"
                className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:border-orange-300 hover:bg-orange-50/30 transition-all shadow-2xs"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-100 text-[#E96A1C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1B1D21] group-hover:text-[#E96A1C] transition-colors">
                    Generate AI Dataset
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Synthesize realistic business databases with interconnected collections.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/assignments"
                className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:border-sky-300 hover:bg-sky-50/30 transition-all shadow-2xs"
              >
                <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1B1D21] group-hover:text-sky-600 transition-colors">
                    Generate Assessment
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Create 15-30 analytical questions and grading criteria from a dataset schema.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/monitor"
                className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all shadow-2xs"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1B1D21] group-hover:text-emerald-600 transition-colors">
                    Live Candidate Monitor
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Inspect real-time candidate query telemetry, execution times, and activity.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/explorer"
                className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:border-purple-300 hover:bg-purple-50/30 transition-all shadow-2xs"
              >
                <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1B1D21] group-hover:text-purple-600 transition-colors">
                    Database Explorer
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Inspect collections, schema structures, document counts, and indexes in MongoDB Atlas.
                  </p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
