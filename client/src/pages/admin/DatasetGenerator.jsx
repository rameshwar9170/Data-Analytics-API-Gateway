import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useSocket } from '../../context/SocketContext';
import {
  Sparkles,
  ShoppingBag,
  GraduationCap,
  Building2,
  Users2,
  Landmark,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  StopCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const INDUSTRIES = [
  { id: 'E-Commerce', name: 'E-Commerce', icon: ShoppingBag, defaultDb: 'icoded_ecommerce_demo' },
  { id: 'College / University ERP', name: 'College ERP', icon: GraduationCap, defaultDb: 'icoded_college_erp_demo' },
  { id: 'Hospital Management', name: 'Hospital', icon: Building2, defaultDb: 'icoded_hospital_demo' },
  { id: 'CRM and Sales', name: 'CRM & Sales', icon: Users2, defaultDb: 'icoded_crm_demo' },
  { id: 'Banking and Finance', name: 'Banking & Finance', icon: Landmark, defaultDb: 'icoded_banking_demo' },
  { id: 'Retail Store', name: 'Retail Store', icon: ShoppingBag, defaultDb: 'icoded_retail_demo' },
  { id: 'Inventory and Warehouse', name: 'Inventory & Warehouse', icon: Building2, defaultDb: 'icoded_inventory_demo' },
  { id: 'HRMS and Employee Management', name: 'HRMS & Employee', icon: Users2, defaultDb: 'icoded_hrms_demo' },
  { id: 'Food Delivery', name: 'Food Delivery', icon: ShoppingBag, defaultDb: 'icoded_food_demo' },
  { id: 'Logistics and Supply Chain', name: 'Logistics & Supply', icon: Building2, defaultDb: 'icoded_logistics_demo' },
];

const PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

export const DatasetGenerator = () => {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0].id);
  const [datasetName, setDatasetName] = useState('iCoded E-Commerce Production Demo');
  const [databaseName, setDatabaseName] = useState('icoded_ecommerce_demo');
  const [description, setDescription] = useState('Realistic interconnected e-commerce analytics dataset with orders, payments, shipments, and customer returns.');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [dataComplexity, setDataComplexity] = useState('medium');
  const [qualityIssuePercentage, setQualityIssuePercentage] = useState(5);
  const [relationshipComplexity, setRelationshipComplexity] = useState('medium');

  // Collections configuration
  const [collections, setCollections] = useState([
    { name: 'customers', targetCount: 1000 },
    { name: 'products', targetCount: 1000 },
    { name: 'categories', targetCount: 100 },
    { name: 'orders', targetCount: 2000 },
    { name: 'order_items', targetCount: 4000 },
    { name: 'payments', targetCount: 2000 },
    { name: 'returns', targetCount: 200 },
    { name: 'reviews', targetCount: 500 },
    { name: 'shipments', targetCount: 1500 },
    { name: 'coupons', targetCount: 100 },
  ]);

  const [newColName, setNewColName] = useState('');
  const [newColCount, setNewColCount] = useState(1000);

  // Live generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [progressData, setProgressData] = useState({
    percentage: 0,
    status: 'idle',
    currentCollection: '',
    targetCount: 0,
    savedCount: 0,
    failedCount: 0,
    message: '',
    logs: [],
  });

  // Industry switch presets
  const handleIndustryChange = (indId) => {
    setSelectedIndustry(indId);
    const ind = INDUSTRIES.find((i) => i.id === indId);
    if (ind) {
      setDatasetName(`iCoded ${ind.name} Demo`);
      setDatabaseName(ind.defaultDb);
      setDescription(`Realistic synthetic ${ind.name} dataset with interconnected relations and intentional data quality variations.`);
    }

    if (indId === 'College / University ERP') {
      setCollections([
        { name: 'students', targetCount: 2000 },
        { name: 'departments', targetCount: 30 },
        { name: 'courses', targetCount: 200 },
        { name: 'faculty', targetCount: 200 },
        { name: 'admissions', targetCount: 2000 },
        { name: 'attendance', targetCount: 5000 },
        { name: 'examinations', targetCount: 500 },
        { name: 'results', targetCount: 3000 },
        { name: 'fee_payments', targetCount: 2000 },
        { name: 'scholarships', targetCount: 300 },
      ]);
    } else if (indId === 'Hospital Management') {
      setCollections([
        { name: 'patients', targetCount: 1000 },
        { name: 'doctors', targetCount: 200 },
        { name: 'departments', targetCount: 20 },
        { name: 'appointments', targetCount: 2000 },
        { name: 'prescriptions', targetCount: 1500 },
        { name: 'medicines', targetCount: 500 },
        { name: 'bills', targetCount: 1500 },
        { name: 'payments', targetCount: 1500 },
        { name: 'lab_reports', targetCount: 800 },
        { name: 'admissions', targetCount: 300 },
      ]);
    } else if (indId === 'CRM and Sales') {
      setCollections([
        { name: 'leads', targetCount: 2000 },
        { name: 'employees', targetCount: 200 },
        { name: 'companies', targetCount: 500 },
        { name: 'activities', targetCount: 3000 },
        { name: 'followups', targetCount: 2000 },
        { name: 'opportunities', targetCount: 1000 },
        { name: 'sales', targetCount: 1500 },
        { name: 'targets', targetCount: 300 },
        { name: 'campaigns', targetCount: 100 },
        { name: 'sources', targetCount: 20 },
      ]);
    } else if (indId === 'Banking and Finance') {
      setCollections([
        { name: 'customers', targetCount: 1000 },
        { name: 'accounts', targetCount: 1500 },
        { name: 'transactions', targetCount: 5000 },
        { name: 'loans', targetCount: 500 },
        { name: 'repayments', targetCount: 2000 },
        { name: 'cards', targetCount: 1000 },
        { name: 'branches', targetCount: 50 },
        { name: 'employees', targetCount: 200 },
        { name: 'complaints', targetCount: 300 },
        { name: 'credit_assessments', targetCount: 500 },
      ]);
    } else {
      setCollections([
        { name: 'customers', targetCount: 1000 },
        { name: 'products', targetCount: 1000 },
        { name: 'categories', targetCount: 100 },
        { name: 'orders', targetCount: 2000 },
        { name: 'order_items', targetCount: 4000 },
        { name: 'payments', targetCount: 2000 },
        { name: 'returns', targetCount: 200 },
        { name: 'reviews', targetCount: 500 },
        { name: 'shipments', targetCount: 1500 },
        { name: 'coupons', targetCount: 100 },
      ]);
    }
  };

  // Socket.IO real-time listener for progress
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      setProgressData((prev) => ({
        ...prev,
        percentage: data.percentage ?? prev.percentage,
        status: data.status ?? prev.status,
        currentCollection: data.currentCollection ?? prev.currentCollection,
        targetCount: data.targetCount ?? prev.targetCount,
        savedCount: data.savedCount ?? prev.savedCount,
        failedCount: data.failedCount ?? prev.failedCount,
        message: data.message || prev.message,
        logs: data.message ? [...prev.logs.slice(-20), `[${new Date().toLocaleTimeString()}] ${data.message}`] : prev.logs,
      }));

      if (data.status === 'completed') {
        setIsGenerating(false);
        toast.success(data.message || 'Dataset generation completed successfully!');
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        setIsGenerating(false);
        toast.error(data.message || 'Generation halted.');
      }
    };

    socket?.on('dataset:progress', handleProgress);
    return () => socket?.off('dataset:progress', handleProgress);
  }, [socket]);

  const handleAddCollection = () => {
    if (!newColName.trim()) return;
    setCollections([...collections, { name: newColName.trim().toLowerCase(), targetCount: parseInt(newColCount, 10) || 1000 }]);
    setNewColName('');
  };

  const handleRemoveCollection = (index) => {
    setCollections(collections.filter((_, i) => i !== index));
  };

  const handleUpdateCount = (index, count) => {
    const updated = [...collections];
    updated[index].targetCount = parseInt(count, 10) || 0;
    setCollections(updated);
  };

  const applyGlobalPreset = (preset) => {
    setCollections(collections.map((c) => ({ ...c, targetCount: preset })));
  };

  const totalTargetRecords = collections.reduce((sum, c) => sum + (c.targetCount || 0), 0);

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgressData({
      percentage: 5,
      status: 'generating',
      currentCollection: '',
      targetCount: 0,
      savedCount: 0,
      failedCount: 0,
      message: 'Contacting MongoDB Atlas & initiating generation engine...',
      logs: [`[${new Date().toLocaleTimeString()}] Initializing generation for ${datasetName}`],
    });

    try {
      const res = await api.post('/datasets', {
        name: datasetName,
        industry: selectedIndustry,
        description,
        difficulty,
        databaseName,
        currency,
        country,
        dataComplexity,
        qualityIssuePercentage,
        relationshipComplexity,
        collections,
      });

      setActiveDatasetId(res.data.dataset._id);
      toast.success('Generation job initiated on Atlas cluster');
    } catch (err) {
      setIsGenerating(false);
      toast.error(err.response?.data?.message || 'Failed to start generation');
    }
  };

  const cancelGeneration = async () => {
    if (!activeDatasetId) return;
    try {
      await api.post(`/datasets/${activeDatasetId}/cancel`);
      toast.info('Cancellation requested');
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="AI Dataset Generator"
        subtitle="Configure and synthesize realistic enterprise datasets with deep relational schemas on Atlas"
      />

      {/* Real-time Progress Monitor if active */}
      {isGenerating && (
        <Card className="border-[#E96A1C]/40 bg-orange-50/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#E96A1C] animate-ping" />
                <h4 className="text-sm font-bold text-[#1B1D21]">Atlas Generation Pipeline Active</h4>
                <Badge variant="orange">{progressData.status}</Badge>
              </div>
              <Button size="sm" variant="danger" icon={StopCircle} onClick={cancelGeneration}>
                Cancel Generation
              </Button>
            </div>

            <ProgressBar progress={progressData.percentage} status={progressData.status} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-gray-100 text-xs">
              <div>
                <p className="text-gray-400 font-medium">Target Collection</p>
                <p className="font-semibold text-[#1B1D21] mt-0.5">{progressData.currentCollection || 'Initializing...'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Saved to Atlas</p>
                <p className="font-semibold text-emerald-600 mt-0.5">{progressData.savedCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Target Records</p>
                <p className="font-semibold text-gray-700 mt-0.5">{progressData.targetCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Live Telemetry</p>
                <p className="text-gray-600 truncate mt-0.5">{progressData.message}</p>
              </div>
            </div>

            {/* Live Log Stream */}
            <div className="bg-[#1B1D21] text-gray-200 font-mono text-[11px] p-3 rounded-lg max-h-36 overflow-y-auto space-y-1">
              {progressData.logs.map((log, i) => (
                <div key={i} className="text-emerald-400 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 1: Industry Selection */}
      <Card title="1. Industry Domain">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {INDUSTRIES.map((ind) => {
            const isSelected = selectedIndustry === ind.id;
            const Icon = ind.icon;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => handleIndustryChange(ind.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#E96A1C] bg-orange-50/50 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg w-fit mb-2 ${
                    isSelected ? 'bg-[#E96A1C] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-xs font-bold ${isSelected ? 'text-[#E96A1C]' : 'text-[#1B1D21]'}`}>{ind.name}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 2: Dataset Configuration */}
      <Card title="2. Configuration & Anomaly Parameters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dataset Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Database Namespace</label>
            <input
              type="text"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg font-mono outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty Tier</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            >
              <option value="Beginner">Beginner (Basic CRUD & Simple Filters)</option>
              <option value="Intermediate">Intermediate (Grouping, Date Aggregates)</option>
              <option value="Advanced">Advanced (Multi-$lookup, Pipeline Optimization)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Country / Region</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Data Quality Issue Percentage ({qualityIssuePercentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="25"
              value={qualityIssuePercentage}
              onChange={(e) => setQualityIssuePercentage(parseInt(e.target.value, 10))}
              className="w-full accent-[#E96A1C] mt-2"
            />
            <p className="text-[10px] text-gray-400 mt-1">Introduces missing values, outliers, and status anomalies.</p>
          </div>
        </div>
      </Card>

      {/* Step 3: Collections & Record Presets */}
      <Card
        title="3. Collections & Volume Targets"
        subtitle={`Total planned records: ${totalTargetRecords.toLocaleString()}`}
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Global Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyGlobalPreset(p)}
                className="px-2 py-1 text-[11px] font-semibold rounded bg-gray-100 hover:bg-[#E96A1C] hover:text-white transition-colors"
              >
                {p >= 1000 ? `${p / 1000}k` : p}
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {collections.map((col, index) => (
              <div
                key={col.name}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50/40 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold font-mono text-[#1B1D21]">{col.name}</p>
                  <p className="text-[11px] text-gray-500">Target records</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={col.targetCount}
                    onChange={(e) => handleUpdateCount(index, e.target.value)}
                    className="w-24 text-xs font-medium p-1.5 border border-gray-300 rounded bg-white text-right outline-none focus:border-[#E96A1C]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCollection(index)}
                    className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom collection */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <input
              type="text"
              placeholder="Add custom collection name..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C] flex-1 max-w-xs"
            />
            <input
              type="number"
              value={newColCount}
              onChange={(e) => setNewColCount(e.target.value)}
              className="text-xs p-2 border border-gray-300 rounded-lg w-28 text-right outline-none focus:border-[#E96A1C]"
            />
            <Button size="sm" variant="outline" icon={Plus} onClick={handleAddCollection}>
              Add Collection
            </Button>
          </div>
        </div>
      </Card>

      {/* Review & Launch */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          icon={Play}
          loading={isGenerating}
          onClick={startGeneration}
          className="shadow-md"
        >
          Generate & Save to MongoDB Atlas
        </Button>
      </div>
    </div>
  );
};

export default DatasetGenerator;
