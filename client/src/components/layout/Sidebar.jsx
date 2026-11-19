import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  Compass,
  FileQuestion,
  ClipboardList,
  Users,
  Activity,
  Award,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'AI Dataset Generator', href: '/admin/generator', icon: Sparkles },
  { name: 'Dataset Manager', href: '/admin/datasets', icon: Database },
  { name: 'Database Explorer', href: '/admin/explorer', icon: Compass },
  { name: 'AI Assignment Generator', href: '/admin/assignments', icon: FileQuestion },
  { name: 'Assessment Manager', href: '/admin/assessments', icon: ClipboardList },
  { name: 'Candidate Management', href: '/admin/candidates', icon: Users },
  { name: 'Live Candidate Monitor', href: '/admin/monitor', icon: Activity },
  { name: 'Evaluation & Reports', href: '/admin/evaluations', icon: Award },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#1B1D21] text-white flex flex-col shrink-0 min-h-screen border-r border-gray-800">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-gray-800/80">
        <div className="h-8 w-8 rounded-lg bg-[#E96A1C] flex items-center justify-center font-bold text-white shadow-xs">
          iC
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">iCoded Automation</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">AI Dataset Platform</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Core Platform
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#E96A1C] text-white shadow-xs'
                  : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-gray-800/80 bg-[#16181B]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@icoded.in'}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
