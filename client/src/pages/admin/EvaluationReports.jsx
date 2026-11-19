import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Award, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const EvaluationReports = () => {
  const [searchParams] = useSearchParams();
  const preselectedAssessmentId = searchParams.get('assessmentId');

  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedAssessmentId || '');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.get('/assessments?status=evaluated');
        const list = res.data.assessments || [];
        setAssessments(list);

        const targetId = preselectedAssessmentId || (list.length > 0 ? list[0]._id : null);
        if (targetId) {
          setSelectedId(targetId);
          fetchReport(targetId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error('Failed to load evaluated assessments');
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [preselectedAssessmentId]);

  const fetchReport = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/${id}/results`);
      setReportData(res.data.assessment);
    } catch (err) {
      toast.error('Failed to load performance report');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (id) => {
    setSelectedId(id);
    fetchReport(id);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Candidate Evaluation & Reports"
        subtitle="Automated grading, pipeline accuracy analysis, strengths, and areas for improvement"
      />

      {/* Assessment Selector */}
      {assessments.length > 1 && (
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">Select Evaluated Assessment:</span>
            <select
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="text-xs p-1.5 border border-gray-300 rounded-lg outline-none"
            >
              {assessments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.candidateId?.name} — {a.assignmentId?.title} ({a.percentage}%)
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner text="Generating evaluation scorecard..." />
      ) : !reportData ? (
        <Card className="text-center py-16">
          <Award className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No Evaluated Assessments Found</p>
          <p className="text-xs text-gray-400 mt-1">
            When candidates submit answers, use "Run Evaluation" in Assessment Manager to grade them.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Executive Scorecard */}
          <Card className="border-[#E96A1C]/30 bg-orange-50/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
              <div>
                <Badge variant="orange" size="sm" className="mb-2">
                  Official Assessment Report
                </Badge>
                <h3 className="text-xl font-bold text-[#1B1D21]">{reportData.candidateId?.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.assignmentId?.title} • Dataset: {reportData.datasetId?.name}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-[#E96A1C]">{reportData.percentage}%</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Overall Grade</p>
                </div>
                <div className="text-center pl-6 border-l border-gray-200">
                  <p className="text-2xl font-bold text-[#1B1D21]">
                    {reportData.totalScore} / {reportData.maxScore}
                  </p>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total Points</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths & Improvement Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Observed Strengths" subtitle="Demonstrated technical mastery in queries">
              <ul className="space-y-2 text-xs text-gray-700">
                {(reportData.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Recommendations for Improvement" subtitle="Targeted analytical areas to refine">
              <ul className="space-y-2 text-xs text-gray-700">
                {(reportData.improvements || []).map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Question Breakdown */}
          <Card title="Detailed Question Breakdown" subtitle="Scored response per task">
            <div className="space-y-3">
              {(reportData.responses || []).map((resp, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B1D21]">Task #{resp.questionIndex + 1}</span>
                    <Badge variant={resp.autoScore > 0 ? 'success' : 'danger'}>
                      Score: {resp.autoScore} pts
                    </Badge>
                  </div>
                  {resp.query && (
                    <div className="bg-[#1B1D21] text-gray-200 font-mono text-[11px] p-2.5 rounded-md overflow-x-auto">
                      <pre>{resp.query}</pre>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-600 italic">Evaluator note: {resp.feedback}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EvaluationReports;
