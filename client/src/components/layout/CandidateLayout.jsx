import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogOut, Terminal, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CandidateLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7]">
      {/* Top navbar for Candidate */}
      <header className="h-16 bg-[#1B1D21] text-white px-6 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#E96A1C] flex items-center justify-center font-bold text-white shadow-xs">
            iC
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">iCoded Automation</h1>
            <p className="text-[10px] text-gray-400">Data Analyst Assessment Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-300">
            <Terminal className="h-4 w-4 text-[#F4A261]" />
            <span>MongoDB Query Console (Read-Only)</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
            <div className="text-right">
              <p className="text-xs font-medium text-white">{user?.name || 'Candidate'}</p>
              <p className="text-[10px] text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
    </div>
  );
};

export default CandidateLayout;
