import api from './api';

export const assessmentService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/assessments', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/assessments/${id}`);
    return data;
  },

  start: async (id) => {
    const { data } = await api.post(`/assessments/${id}/start`);
    return data;
  },

  submit: async (id) => {
    const { data } = await api.post(`/assessments/${id}/submit`);
    return data;
  },

  getProgress: async (id) => {
    const { data } = await api.get(`/assessments/${id}/progress`);
    return data;
  },

  getResults: async (id) => {
    const { data } = await api.get(`/assessments/${id}/results`);
    return data;
  },

  evaluate: async (id) => {
    const { data } = await api.post(`/assessments/${id}/evaluate`);
    return data;
  },

  getActive: async () => {
    const { data } = await api.get('/assessments/active');
    return data;
  },
};

export default assessmentService;
