import api from './api';

export const candidateService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/candidates', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/candidates/${id}`);
    return data;
  },

  create: async (candidateData) => {
    const { data } = await api.post('/candidates', candidateData);
    return data;
  },

  update: async (id, updates) => {
    const { data } = await api.put(`/candidates/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/candidates/${id}`);
    return data;
  },

  getAssessments: async (id) => {
    const { data } = await api.get(`/candidates/${id}/assessments`);
    return data;
  },

  getActivity: async (id, params = {}) => {
    const { data } = await api.get(`/candidates/${id}/activity`, { params });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/candidates/stats');
    return data;
  },
};

export default candidateService;
