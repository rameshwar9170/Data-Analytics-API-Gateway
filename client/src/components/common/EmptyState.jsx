import React from 'react';

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

export default EmptyState;
