import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Lock, Mail, ArrowRight, Shield, UserCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('admin@icoded.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const performLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setDbError(null);
    try {
      const user = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      const details = err.response?.data?.details;
      if (details) {
        setDbError(details);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickLogin = async (role) => {
    if (role === 'admin') {
      setEmail('admin@icoded.in');
      setPassword('admin123');
      await performLogin('admin@icoded.in', 'admin123');
    } else {
      setEmail('candidate@icoded.in');
      setPassword('candidate123');
      await performLogin('candidate@icoded.in', 'candidate123');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#E96A1C] flex items-center justify-center font-bold text-white text-xl shadow-md">
          iC
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#1B1D21]">iCoded Automation</h2>
        <p className="mt-1 text-xs text-gray-500">
          AI-Powered Realistic Dataset Generator & Assessment Platform
        </p>
      </div>

      <div className="mt-6 w-full max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">
          {dbError && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <p className="font-semibold mb-1">Atlas Network Access Required</p>
              <p className="text-[11px] leading-relaxed text-amber-700">{dbError}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Email Address</label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E96A1C] focus:border-[#E96A1C] outline-none"
                  placeholder="admin@icoded.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E96A1C] focus:border-[#E96A1C] outline-none"
                  placeholder="admin123"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center font-semibold text-gray-500 mb-3">
              One-Click Instant Demo Login
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 text-[#E96A1C] transition-colors cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5 text-[#E96A1C]" />
                Admin Portal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('candidate')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 transition-colors cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                Candidate Lab
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-gray-400">
              Clicking either button fills credentials &amp; signs in immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
