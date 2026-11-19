import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, footer, noPadding = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            {title && <h3 className="text-sm font-bold text-[#1B1D21] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
      {footer && <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100">{footer}</div>}
    </div>
  );
};

export default Card;
