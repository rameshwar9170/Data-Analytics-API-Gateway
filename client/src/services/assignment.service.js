import api from './api';

export const assignmentService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/assignments', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/assignments/${id}`);
    return data;
  },

  generate: async (config) => {
    const { data } = await api.post('/assignments/generate', config);
    return data;
  },

  update: async (id, updates) => {
    const { data } = await api.put(`/assignments/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/assignments/${id}`);
    return data;
  },

  publish: async (id) => {
    const { data } = await api.post(`/assignments/${id}/publish`);
    return data;
  },

  assign: async (id, candidateIds) => {
    const { data } = await api.post(`/assignments/${id}/assign`, { candidateIds });
    return data;
  },

  getQuestions: async (id) => {
    const { data } = await api.get(`/assignments/${id}/questions`);
    return data;
  },

  updateQuestion: async (id, questionId, updates) => {
    const { data } = await api.put(`/assignments/${id}/questions/${questionId}`, updates);
    return data;
  },
};

export default assignmentService;
