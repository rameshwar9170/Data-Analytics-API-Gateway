export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validatePositiveNumber = (value, fieldName = 'Value') => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
};

export const validateRange = (value, min, max, fieldName = 'Value') => {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

export const validateDatasetConfig = (config) => {
  const errors = {};
  if (!config.name?.trim()) errors.name = 'Dataset name is required';
  if (!config.industry) errors.industry = 'Industry is required';
  if (!config.collections?.length) errors.collections = 'At least one collection is required';
  return Object.keys(errors).length ? errors : null;
};
