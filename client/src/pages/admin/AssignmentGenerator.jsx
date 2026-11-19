import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Sparkles,
  FileQuestion,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const AssignmentGenerator = () => {
  const [searchParams] = useSearchParams();
  const preselectedDatasetId = searchParams.get('datasetId');

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(preselectedDatasetId || '');
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [timeLimit, setTimeLimit] = useState(120);

  const [generating, setGenerating] = useState(false);
  const [createdAssignment, setCreatedAssignment] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await api.get('/datasets');
        const list = res.data.datasets || [];
        setDatasets(list);
        if (!selectedDatasetId && list.length > 0) {
          setSelectedDatasetId(list[0]._id);
          setTitle(`${list[0].name} - Data Analyst Challenge`);
        }
      } catch (err) {
        toast.error('Failed to load datasets');
      }
    };
    fetchDatasets();
  }, []);

  const handleDatasetChange = (id) => {
    setSelectedDatasetId(id);
    const ds = datasets.find((d) => d._id === id);
    if (ds) {
      setTitle(`${ds.name} - Technical Data Analyst Assessment`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedDatasetId) {
      toast.error('Please select a dataset');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/assignments/generate', {
        datasetId: selectedDatasetId,
        title,
        questionCount,
        difficulty,
        timeLimit,
      });

      setCreatedAssignment(res.data.assignment);
      toast.success('Assignment with 20 questions successfully generated & published!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate assignment');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="AI Assignment Generator"
        subtitle="Generate 15–30 MongoDB aggregation & analysis challenges based on real Atlas collections"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Assessment Parameters">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Dataset</label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                >
                  {datasets.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Question Count</label>
                  <input
                    type="number"
                    min="10"
                    max="30"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Configurable: 15–30</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                >
                  <option value="Beginner">Beginner (CRUD & Simple Filters)</option>
                  <option value="Intermediate">Intermediate (Aggregations, Grouping, KPIs)</option>
                  <option value="Advanced">Advanced (Multi-stage $lookup, $unwind, Windowing)</option>
                </select>
              </div>

              <Button
                loading={generating}
                onClick={handleGenerate}
                icon={Sparkles}
                className="w-full"
              >
                Generate Assessment with AI
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Panel: Generated Questions Preview */}
        <div className="lg:col-span-7 space-y-4">
          {createdAssignment ? (
            <Card
              title={createdAssignment.title}
              subtitle={`${createdAssignment.questions.length} questions • ${createdAssignment.totalMarks} total marks • ${createdAssignment.timeLimit} mins`}
              action={<Badge variant="success">Published</Badge>}
            >
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {createdAssignment.questions.map((q, idx) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="w-full p-3 text-left flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-[#1B1D21] text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-[#1B1D21]">{q.title}</span>
                          <Badge variant="orange" size="sm">
                            {q.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-600">{q.marks} pts</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-3 text-xs border-t border-gray-100">
                          <div>
                            <p className="font-semibold text-gray-700">Business Scenario:</p>
                            <p className="text-gray-600 mt-0.5">{q.scenario}</p>
                          </div>

                          <div>
                            <p className="font-semibold text-[#1B1D21]">Task Description:</p>
                            <p className="text-gray-800 font-medium mt-0.5 bg-orange-50/40 p-2.5 rounded-lg border border-orange-100">
                              {q.task}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="font-semibold text-gray-500">Collections: </span>
                              <span className="font-mono text-[#E96A1C]">{q.collections?.join(', ')}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Time Estimate: </span>
                              <span>{q.timeEstimate}</span>
                            </div>
                          </div>

                          <div>
                            <p className="font-semibold text-gray-700">Expected Output:</p>
                            <p className="text-gray-500 font-mono text-[11px] mt-0.5">{q.expectedOutput}</p>
                          </div>

                          <div>
                            <p className="font-semibold text-emerald-800">Hidden Evaluation Criteria:</p>
                            <p className="text-gray-600 text-[11px] mt-0.5">{q.evaluationCriteria}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-16">
              <FileQuestion className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No Assessment Generated Yet</p>
              <p className="text-xs text-gray-400 mt-1">Select a dataset on the left and click Generate</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGenerator;
