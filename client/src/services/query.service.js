import api from './api';

export const queryService = {
  execute: async (queryData) => {
    const { data } = await api.post('/queries/execute', queryData);
    return data;
  },

  getHistory: async (params = {}) => {
    const { data } = await api.get('/queries/history', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/queries/${id}`);
    return data;
  },

  submitAnswer: async (assessmentId, questionId, queryData) => {
    const { data } = await api.post(`/queries/submit/${assessmentId}/${questionId}`, queryData);
    return data;
  },

  validate: async (queryData) => {
    const { data } = await api.post('/queries/validate', queryData);
    return data;
  },

  explain: async (queryData) => {
    const { data } = await api.post('/queries/explain', queryData);
    return data;
  },
};

export default queryService;
