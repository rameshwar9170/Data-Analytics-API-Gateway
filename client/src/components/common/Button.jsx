import React from 'react';

const variants = {
  primary: 'bg-[#E96A1C] hover:bg-[#d45a0c] text-white shadow-sm focus:ring-[#E96A1C]',
  secondary: 'bg-[#1B1D21] hover:bg-[#2A2D33] text-white focus:ring-[#1B1D21]',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-[#E96A1C]',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs font-medium',
  md: 'px-3.5 py-2 text-sm font-medium',
  lg: 'px-4 py-2.5 text-base font-medium',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className={`mr-2 h-4 w-4 ${size === 'sm' ? 'h-3.5 w-3.5 mr-1.5' : ''}`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
