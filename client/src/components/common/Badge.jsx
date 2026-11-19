import React from 'react';

const variants = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  orange: 'bg-orange-50 text-[#E96A1C] border-orange-200',
  charcoal: 'bg-[#1B1D21] text-white border-transparent',
};

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant] || variants.default} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
