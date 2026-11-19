import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Users, UserPlus, Eye, ShieldCheck, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Candidate@123');
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data.candidates || []);
    } catch (err) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/candidates', { name, email, password });
      toast.success('Candidate profile created successfully');
      setModalOpen(false);
      setName('');
      setEmail('');
      fetchCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Candidate Management"
        subtitle="Manage enrolled Data Analyst candidates and their assigned sandbox environments"
        actions={
          <Button icon={UserPlus} onClick={() => setModalOpen(true)}>
            Add Candidate
          </Button>
        }
      />

      <Card>
        {loading ? (
          <LoadingSpinner text="Loading candidate accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead>
                <tr className="text-gray-400 uppercase font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Assessments</th>
                  <th className="pb-3">Current Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-[#1B1D21] flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-orange-100 text-[#E96A1C] flex items-center justify-center font-bold text-[11px]">
                        {c.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3 text-gray-600 font-mono text-[11px]">{c.email}</td>
                    <td className="py-3 font-medium text-gray-800">{c.assessmentCount || 0}</td>
                    <td className="py-3">
                      <Badge variant={c.lastStatus === 'evaluated' ? 'success' : c.lastStatus === 'in_progress' ? 'orange' : 'default'}>
                        {c.lastStatus || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Link to={`/admin/candidates/${c._id}`}>
                        <Button size="sm" variant="outline" icon={Eye}>
                          Activity & Queries
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Candidate Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="rahul@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={submitting}>
              Create Candidate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CandidateManagement;
