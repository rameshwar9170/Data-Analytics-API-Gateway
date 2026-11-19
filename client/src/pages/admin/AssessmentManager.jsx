import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ClipboardList, Plus, UserCheck, Play, Award, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const AssessmentManager = () => {
  const [assessments, setAssessments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assRes, candRes, assignRes] = await Promise.all([
        api.get('/assessments'),
        api.get('/candidates'),
        api.get('/assignments'),
      ]);
      setAssessments(assRes.data.assessments || []);
      setCandidates(candRes.data.candidates || []);
      setAssignments(assignRes.data.assignments || []);

      if (candRes.data.candidates?.length > 0) setSelectedCandidate(candRes.data.candidates[0]._id);
      if (assignRes.data.assignments?.length > 0) setSelectedAssignment(assignRes.data.assignments[0]._id);
    } catch (err) {
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedAssignment) {
      toast.error('Please select both candidate and assignment');
      return;
    }

    setAssigning(true);
    try {
      await api.post('/assessments/assign', {
        candidateId: selectedCandidate,
        assignmentId: selectedAssignment,
        expiryDays: 7,
      });
      toast.success('Assessment successfully assigned with secure Atlas access token');
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleTriggerEvaluation = async (assessmentId) => {
    try {
      await api.post(`/assessments/${assessmentId}/evaluate`);
      toast.success('Automated evaluation completed');
      fetchData();
    } catch (err) {
      toast.error('Evaluation failed');
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Assessment Manager"
        subtitle="Manage candidate sessions, access credentials, and automated grading"
        actions={
          <Button icon={Plus} onClick={() => setAssignModalOpen(true)}>
            Assign Assessment
          </Button>
        }
      />

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading assessments..." />
        ) : assessments.length === 0 ? (
          <p className="text-center py-12 text-xs text-gray-500">
            No active assessments. Click "Assign Assessment" to enroll a candidate.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead>
                <tr className="text-gray-400 uppercase font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Assessment Title</th>
                  <th className="pb-3">Assigned Dataset</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Score / Grade</th>
                  <th className="pb-3">Responses</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <p className="font-bold text-[#1B1D21]">{a.candidateId?.name || 'Candidate'}</p>
                      <p className="text-[11px] text-gray-500">{a.candidateId?.email}</p>
                    </td>
                    <td className="py-3 font-medium text-gray-800">{a.assignmentId?.title || 'Assessment'}</td>
                    <td className="py-3 font-mono text-[11px] text-[#E96A1C]">{a.datasetId?.databaseName}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          a.status === 'evaluated'
                            ? 'success'
                            : a.status === 'in_progress'
                            ? 'orange'
                            : a.status === 'submitted'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3 font-bold">
                      {a.totalScore !== undefined && a.maxScore
                        ? `${a.totalScore} / ${a.maxScore} (${a.percentage}%)`
                        : '—'}
                    </td>
                    <td className="py-3 text-gray-600 font-medium">{a.responses?.length || 0} submitted</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === 'submitted' && (
                          <Button size="sm" variant="outline" onClick={() => handleTriggerEvaluation(a._id)}>
                            Run Evaluation
                          </Button>
                        )}
                        <Link to={`/admin/evaluations?assessmentId=${a._id}`}>
                          <button
                            title="View Score Report"
                            className="p-1.5 text-gray-500 hover:text-[#E96A1C] hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Award className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Assessment to Candidate"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Candidate</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            >
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Assignment Challenge</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            >
              {assignments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} ({a.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={assigning}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssessmentManager;
