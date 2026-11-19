import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  Play,
  Save,
  Send,
  Clock,
  Terminal,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CandidateWorkspace = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Query editor state
  const [queryType, setQueryType] = useState('find'); // 'find' | 'aggregate'
  const [selectedCol, setSelectedCol] = useState('');
  const [queryText, setQueryText] = useState('{}');
  const [executing, setExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [resultView, setResultView] = useState('json'); // 'table' | 'json'

  // Submissions state
  const [savingResponse, setSavingResponse] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Fetch assigned assessment
  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/my');
      const ass = res.data.assessment;
      setAssessment(ass);

      // Auto start if status is 'assigned'
      if (ass.status === 'assigned') {
        await api.post(`/assessments/${ass._id}/start`);
        ass.status = 'in_progress';
      }

      // Preselect collection
      if (ass.datasetId?.collections?.length > 0) {
        setSelectedCol(ass.datasetId.collections[0].name);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'No active assessment assigned to your account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, []);

  // When active question changes, set collection if referenced
  useEffect(() => {
    if (!assessment || !assessment.assignmentId?.questions) return;
    const q = assessment.assignmentId.questions[activeQuestionIndex];
    if (q?.collections?.length > 0) {
      setSelectedCol(q.collections[0]);
    }

    // Load any draft response
    const existingResp = assessment.responses?.find((r) => r.questionIndex === activeQuestionIndex);
    if (existingResp) {
      setQueryText(existingResp.query || '{}');
      if (existingResp.result) {
        setQueryResults(existingResp.result);
      }
    } else {
      setQueryText(queryType === 'aggregate' ? '[\n  { "$match": {} }\n]' : '{}');
    }
  }, [activeQuestionIndex, assessment, queryType]);

  const handleExecuteQuery = async () => {
    if (!selectedCol) {
      toast.error('Please select a collection');
      return;
    }

    setExecuting(true);
    setQueryResults(null);
    setExecutionStats(null);

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(queryText);
    } catch (err) {
      toast.error('Invalid JSON in query editor');
      setExecuting(false);
      return;
    }

    try {
      const res = await api.post('/queries/execute', {
        collection: selectedCol,
        queryType,
        query: parsedPayload,
        options: { limit: 100 },
      });

      setQueryResults(res.data.results || []);
      setExecutionStats({
        duration: res.data.executionTime,
        count: res.data.resultCount,
      });
      toast.success(`Executed in ${res.data.executionTime}ms (${res.data.resultCount} docs)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Query execution failed');
      setQueryResults([]);
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!queryResults) {
      toast.error('Please execute query first to verify results');
      return;
    }

    setSavingResponse(true);
    try {
      await api.post(`/assessments/${assessment._id}/responses`, {
        questionIndex: activeQuestionIndex,
        query: queryText,
        result: queryResults.slice(0, 20),
      });

      toast.success(`Answer saved for Task #${activeQuestionIndex + 1}`);

      // Update local state
      const updatedResponses = [...(assessment.responses || [])];
      const exist = updatedResponses.findIndex((r) => r.questionIndex === activeQuestionIndex);
      if (exist >= 0) {
        updatedResponses[exist] = { questionIndex: activeQuestionIndex, query: queryText };
      } else {
        updatedResponses.push({ questionIndex: activeQuestionIndex, query: queryText });
      }
      setAssessment({ ...assessment, responses: updatedResponses });
    } catch (err) {
      toast.error('Failed to save response');
    } finally {
      setSavingResponse(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmittingAssessment(true);
    try {
      await api.post(`/assessments/${assessment._id}/submit`);
      toast.success('Assessment successfully submitted for automated grading!');
      setConfirmSubmitOpen(false);
      fetchAssessment();
    } catch (err) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to your isolated sandbox..." />;
  if (!assessment) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="text-center p-8 max-w-md">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1B1D21]">No Active Assessment</h3>
          <p className="text-xs text-gray-500 mt-1">
            You do not have an active assessment assigned. Please contact your hiring manager or administrator.
          </p>
        </Card>
      </div>
    );
  }

  const questions = assessment.assignmentId?.questions || [];
  const currentQ = questions[activeQuestionIndex];
  const isSubmitted = assessment.status === 'submitted' || assessment.status === 'evaluated';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F7]">
      {/* Top Bar with Timer and Submit Button */}
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="orange" size="sm">
            {assessment.assignmentId?.difficulty || 'Intermediate'}
          </Badge>
          <span className="text-xs font-bold text-[#1B1D21]">{assessment.assignmentId?.title}</span>
          <span className="text-xs font-mono text-gray-500">[{assessment.datasetId?.databaseName}]</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Clock className="h-3.5 w-3.5 text-[#E96A1C]" />
            <span>Time Remaining: ~{assessment.assignmentId?.timeLimit || 120} mins</span>
          </div>

          {!isSubmitted && (
            <Button
              size="sm"
              icon={Send}
              onClick={() => setConfirmSubmitOpen(true)}
              className="shadow-xs"
            >
              Final Submit Assessment
            </Button>
          )}

          {isSubmitted && (
            <Badge variant="success" size="md">
              Assessment Submitted
            </Badge>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Column: Questions List & Task Detail */}
        <div className="lg:col-span-5 border-r border-gray-200 bg-white flex flex-col min-h-0">
          {/* Question Navigator */}
          <div className="p-3 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
            {questions.map((q, idx) => {
              const isAnswered = assessment.responses?.some((r) => r.questionIndex === idx);
              const isActive = activeQuestionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#E96A1C] text-white shadow-xs'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Task Description */}
          {currentQ && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">
                  Task {activeQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-[#E96A1C] bg-orange-50 px-2 py-0.5 rounded">
                  {currentQ.marks} Marks
                </span>
              </div>

              <h3 className="text-base font-bold text-[#1B1D21]">{currentQ.title}</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-700">Business Scenario</p>
                  <p className="text-gray-600 mt-1 leading-relaxed">{currentQ.scenario}</p>
                </div>

                <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
                  <p className="font-bold text-[#1B1D21]">Task Requirement</p>
                  <p className="text-gray-800 mt-1 leading-relaxed font-medium">{currentQ.task}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Relevant Collections</p>
                  <div className="flex gap-1.5 mt-1">
                    {currentQ.collections?.map((c) => (
                      <span key={c} className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Expected Output Format</p>
                  <p className="text-gray-500 font-mono text-[11px] mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                    {currentQ.expectedOutput}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Query Console & Results */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#FAF9F7]">
          {/* Query Console Controls */}
          <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Query Type Toggle */}
              <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setQueryType('find')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    queryType === 'find' ? 'bg-white text-[#1B1D21] shadow-xs' : 'text-gray-600'
                  }`}
                >
                  find()
                </button>
                <button
                  type="button"
                  onClick={() => setQueryType('aggregate')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    queryType === 'aggregate' ? 'bg-white text-[#1B1D21] shadow-xs' : 'text-gray-600'
                  }`}
                >
                  aggregate()
                </button>
              </div>

              {/* Collection selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Collection:</span>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  className="font-mono text-xs p-1.5 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C] bg-white"
                >
                  {assessment.datasetId?.collections?.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={Play}
                loading={executing}
                onClick={handleExecuteQuery}
              >
                Execute Query
              </Button>

              {!isSubmitted && (
                <Button
                  size="sm"
                  icon={Save}
                  loading={savingResponse}
                  onClick={handleSaveResponse}
                >
                  Save Answer
                </Button>
              )}
            </div>
          </div>

          {/* Monaco-like Editor Textarea */}
          <div className="p-4 bg-white border-b border-gray-200">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              MongoDB {queryType.toUpperCase()} Query (JSON syntax)
            </label>
            <textarea
              rows={6}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-[#1B1D21] text-emerald-400 rounded-lg outline-none focus:ring-1 focus:ring-[#E96A1C]"
              spellCheck="false"
            />
          </div>

          {/* Results Panel */}
          <div className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1B1D21]">Query Output</span>
                {executionStats && (
                  <span className="text-[11px] text-gray-500">
                    ({executionStats.count} documents in {executionStats.duration}ms)
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto font-mono text-xs">
              {executing ? (
                <LoadingSpinner text="Executing read query against MongoDB Atlas..." />
              ) : queryResults === null ? (
                <div className="text-center py-12 text-gray-400">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click "Execute Query" to inspect results</p>
                </div>
              ) : queryResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Query returned 0 matching records.</p>
              ) : (
                <pre className="text-gray-800 whitespace-pre-wrap text-[11px]">
                  {JSON.stringify(queryResults, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Final Submit */}
      <Modal
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Submit Final Assessment"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmSubmitOpen(false)}>
              Keep Working
            </Button>
            <Button size="sm" loading={submittingAssessment} onClick={handleFinalSubmit}>
              Submit Assessment Now
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-gray-600">
          <p>
            Are you sure you want to finalize and submit your assessment?
          </p>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-[#1B1D21]">
            <p className="font-semibold">Answered Tasks:</p>
            <p className="text-lg font-bold text-[#E96A1C]">
              {assessment.responses?.length || 0} of {questions.length} completed
            </p>
          </div>
          <p>
            Once submitted, your queries will be automatically evaluated against the benchmark results.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CandidateWorkspace;
