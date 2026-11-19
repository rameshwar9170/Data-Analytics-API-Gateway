import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Clock,
  Terminal,
  Activity,
  Award,
  CheckCircle2,
  XCircle,
  Database,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CandidateDetails = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'timeline' | 'assessments'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candRes, actRes, qRes] = await Promise.all([
          api.get(`/candidates/${id}`),
          api.get(`/candidates/${id}/activity`),
          api.get(`/candidates/${id}/queries`),
        ]);

        setCandidate(candRes.data.candidate);
        setAssessments(candRes.data.assessments || []);
        setTimeline(actRes.data.logs || []);
        setQueries(qRes.data.queries || []);
      } catch (err) {
        toast.error('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading candidate telemetry..." />;
  if (!candidate) return <p className="text-center py-12 text-xs text-gray-500">Candidate not found</p>;

  return (
    <div className="space-y-6">
      <Header
        title={candidate.name}
        subtitle={`${candidate.email} • Candidate Profile & Audit Log`}
        actions={
          <Link to="/admin/candidates">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Back to Candidates
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('queries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'queries'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Terminal className="h-4 w-4" />
          Executed Queries ({queries.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'assessments'
              ? 'border-[#E96A1C] text-[#E96A1C]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Award className="h-4 w-4" />
          Assessments & Grades ({assessments.length})
        </button>
      </div>

      {/* Tab: Queries */}
      {activeTab === 'queries' && (
        <Card title="Executed MongoDB Queries" subtitle="Live audit of every query run against assigned Atlas dataset">
          {queries.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">No queries executed yet.</p>
          ) : (
            <div className="space-y-3">
              {queries.map((q) => (
                <div key={q._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={q.status === 'success' ? 'success' : 'danger'}>{q.queryType}</Badge>
                      <span className="font-bold text-[#1B1D21]">{q.database}.{q.collection}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{q.executionTime}ms • {new Date(q.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-gray-700 font-mono text-[11px] whitespace-pre-wrap bg-white p-2 rounded border border-gray-100">
                    {q.query}
                  </pre>
                  {q.errorMessage && <p className="text-rose-600 text-[11px] font-sans">Error: {q.errorMessage}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <Card title="Candidate Activity Audit Stream" subtitle="Timestamped session actions, logins, and submissions">
          {timeline.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">No activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((act) => (
                <div key={act._id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white text-xs">
                  <span className="h-2 w-2 rounded-full bg-[#E96A1C] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-[10px] text-gray-400">{act.type}</span>
                      <span className="text-[10px] text-gray-400">{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-800 font-medium mt-0.5">{JSON.stringify(act.details)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Assessments */}
      {activeTab === 'assessments' && (
        <Card title="Enrolled Assessments">
          <div className="space-y-3">
            {assessments.map((a) => (
              <div key={a._id} className="p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-[#1B1D21]">{a.assignmentId?.title}</h4>
                  <p className="text-gray-500 text-[11px] mt-0.5">Database: {a.datasetId?.databaseName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={a.status === 'evaluated' ? 'success' : 'orange'}>{a.status}</Badge>
                  <span className="font-bold">
                    {a.totalScore !== undefined ? `${a.totalScore} pts (${a.percentage}%)` : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CandidateDetails;
