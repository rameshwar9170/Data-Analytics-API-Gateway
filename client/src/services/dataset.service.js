import api from './api';

export const datasetService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/datasets', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/datasets/${id}`);
    return data;
  },

  generate: async (config) => {
    const { data } = await api.post('/datasets/generate', config);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/datasets/${id}`);
    return data;
  },

  getSchema: async (id) => {
    const { data } = await api.get(`/datasets/${id}/schema`);
    return data;
  },

  getQualityReport: async (id) => {
    const { data } = await api.get(`/datasets/${id}/quality`);
    return data;
  },

  preview: async (id, collection, params = {}) => {
    const { data } = await api.get(`/datasets/${id}/preview/${collection}`, { params });
    return data;
  },

  getIndustries: async () => {
    const { data } = await api.get('/datasets/industries');
    return data;
  },

  getTemplates: async (industry) => {
    const { data } = await api.get(`/datasets/templates/${industry}`);
    return data;
  },

  regenerate: async (id) => {
    const { data } = await api.post(`/datasets/${id}/regenerate`);
    return data;
  },

  cancelGeneration: async (id) => {
    const { data } = await api.post(`/datasets/${id}/cancel`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/datasets/stats');
    return data;
  },
};

export default datasetService;
