import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export const Header = ({ title, subtitle, actions }) => {
  return (
    <header className="-mx-8 -mt-8 mb-8 px-8 py-4 bg-white border-b border-gray-200/90 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-[#1B1D21] tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-semibold shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="h-3.5 w-3.5" />
          <span>MongoDB Atlas Connected</span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};

export default Header;
