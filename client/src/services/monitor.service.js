import api from './api';

export const monitorService = {
  getActiveSessions: async () => {
    const { data } = await api.get('/monitor/sessions');
    return data;
  },

  getSessionDetails: async (sessionId) => {
    const { data } = await api.get(`/monitor/sessions/${sessionId}`);
    return data;
  },

  getActivityFeed: async (params = {}) => {
    const { data } = await api.get('/monitor/activity', { params });
    return data;
  },

  getDashboardStats: async () => {
    const { data } = await api.get('/monitor/stats');
    return data;
  },

  getSystemHealth: async () => {
    const { data } = await api.get('/monitor/health');
    return data;
  },

  getDatabases: async () => {
    const { data } = await api.get('/monitor/databases');
    return data;
  },

  getCollections: async (dbName) => {
    const { data } = await api.get(`/monitor/databases/${dbName}/collections`);
    return data;
  },

  getCollectionData: async (dbName, collName, params = {}) => {
    const { data } = await api.get(`/monitor/databases/${dbName}/${collName}`, { params });
    return data;
  },

  getCollectionStats: async (dbName, collName) => {
    const { data } = await api.get(`/monitor/databases/${dbName}/${collName}/stats`);
    return data;
  },
};

export default monitorService;
