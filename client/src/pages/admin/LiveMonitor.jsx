import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSocket } from '../../context/SocketContext';
import {
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Radio,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const LiveMonitor = () => {
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  const fetchLiveTelemetry = async () => {
    try {
      const [candRes, statsRes] = await Promise.all([
        api.get('/monitor/active'),
        api.get('/monitor/stats'),
      ]);
      setActiveCandidates(candRes.data.activeAssessments || []);
      setLiveStats(statsRes.data.stats || null);
    } catch (err) {
      console.error('Telemetry fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 5000); // 5s polling fallback
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Live Candidate Monitor"
        subtitle="Real-time telemetry, active session audit, query execution duration, and error monitoring"
        actions={
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-600">LIVE FEED</span>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Active Candidates</p>
          <p className="text-2xl font-bold text-[#1B1D21] mt-1">{liveStats?.activeAssessments || 0}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Currently querying Atlas</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Total Queries</p>
          <p className="text-2xl font-bold text-[#1B1D21] mt-1">{(liveStats?.totalQueriesExecuted || 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 mt-1">Across all assessment sessions</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Failed Queries</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{liveStats?.failedQueriesCount || 0}</p>
          <p className="text-[11px] text-gray-500 mt-1">Syntax or timeout exceptions</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Completed Sessions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{liveStats?.completedAssessments || 0}</p>
          <p className="text-[11px] text-gray-500 mt-1">Final submissions evaluated</p>
        </Card>
      </div>

      {/* Active Candidate Sessions */}
      <Card
        title="Active Assessment Sessions"
        subtitle="Real-time telemetry updated every 5 seconds via Socket.IO"
      >
        {loading ? (
          <LoadingSpinner text="Connecting to telemetry stream..." />
        ) : activeCandidates.length === 0 ? (
          <p className="text-center py-12 text-xs text-gray-500">
            No candidates are currently active. When a candidate opens their workspace and executes queries, live telemetry appears here.
          </p>
        ) : (
          <div className="space-y-4">
            {activeCandidates.map((session) => (
              <div
                key={session._id}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#1B1D21] text-white flex items-center justify-center font-bold text-xs">
                      {session.candidateId?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1B1D21]">{session.candidateId?.name}</h4>
                      <p className="text-[11px] text-gray-500">{session.candidateId?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'in_progress' ? 'orange' : 'default'}>
                      {session.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-gray-500">
                      DB: {session.datasetId?.databaseName}
                    </span>
                  </div>
                </div>

                {/* Session telemetry stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Queries Run: </span>
                    <span className="font-bold text-[#1B1D21]">{session.stats?.totalQueries || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Failed Attempts: </span>
                    <span className="font-bold text-rose-600">{session.stats?.failedQueries || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Tasks Answered: </span>
                    <span className="font-bold text-emerald-600">
                      {session.responses?.length || 0} / {session.assignmentId?.totalQuestions || 20}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Last Event: </span>
                    <span className="font-mono text-gray-600">{session.stats?.lastAction || 'active'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LiveMonitor;
