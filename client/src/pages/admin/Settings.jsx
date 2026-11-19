import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Settings as SettingsIcon, Database, Shield, Cpu, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data.settings);
        setSystemStatus(res.data.systemStatus);
      } catch (err) {
        toast.error('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading system configuration..." />;

  return (
    <div className="space-y-6">
      <Header
        title="System Settings"
        subtitle="MongoDB Atlas cluster settings, OpenAI provider status, and security limits"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="space-y-4">
          <Card title="Cluster & AI Health">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600">Database Status:</span>
                <Badge variant={systemStatus?.databaseStatus === 'connected' ? 'success' : 'danger'}>
                  {systemStatus?.databaseStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600">Atlas Host:</span>
                <span className="font-mono text-gray-800 text-[11px] truncate max-w-[150px]">
                  {systemStatus?.databaseHost}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600">AI Provider:</span>
                <Badge variant={systemStatus?.openaiConfigured ? 'success' : 'info'}>
                  {systemStatus?.openaiConfigured ? 'OpenAI GPT-4' : 'Expert Built-in Engine'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-gray-600">Environment:</span>
                <span className="font-bold text-[#1B1D21]">{systemStatus?.nodeEnv}</span>
              </div>
            </div>
          </Card>

          <Card title="Branding Guidelines">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#1B1D21] text-white text-center font-mono">
                #1B1D21 (Charcoal)
              </div>
              <div className="p-2 rounded bg-[#E96A1C] text-white text-center font-mono">
                #E96A1C (Orange)
              </div>
              <div className="p-2 rounded bg-[#F4A261] text-gray-900 text-center font-mono">
                #F4A261 (Light Orange)
              </div>
              <div className="p-2 rounded bg-[#FAF9F7] text-gray-800 border text-center font-mono">
                #FAF9F7 (Cream)
              </div>
            </div>
          </Card>
        </div>

        {/* Config Form */}
        <div className="md:col-span-2">
          <Card title="Generation & Query Limits">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Records per Collection
                  </label>
                  <input
                    type="number"
                    value={settings?.maxRecordsPerCollection || 100000}
                    onChange={(e) =>
                      setSettings({ ...settings, maxRecordsPerCollection: parseInt(e.target.value, 10) })
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bulk Insert Batch Size</label>
                  <input
                    type="number"
                    value={settings?.batchSize || 1000}
                    onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value, 10) })}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Candidate Query Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={settings?.queryTimeoutMs || 30000}
                    onChange={(e) =>
                      setSettings({ ...settings, queryTimeoutMs: parseInt(e.target.value, 10) })
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Query Result Limit</label>
                  <input
                    type="number"
                    value={settings?.queryResultLimit || 1000}
                    onChange={(e) =>
                      setSettings({ ...settings, queryResultLimit: parseInt(e.target.value, 10) })
                    }
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E96A1C]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" icon={Save} loading={saving}>
                  Save System Settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
