import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-[#E96A1C] ${sizeMap[size] || sizeMap.md}`}
      />
      {text && <p className="text-xs font-medium text-gray-500">{text}</p>}
    </div>
  );
};

export const EmptyState = ({ title = 'No data found', description, action, icon: Icon }) => {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#E96A1C] mb-3">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
