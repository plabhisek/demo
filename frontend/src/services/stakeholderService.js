import api from './api';

const stakeholderService = {
  getAllStakeholders: async (params = {}) => {
    const response = await api.get('/stakeholders', { params });
    return response.data;
  },

  getStakeholderById: async (id) => {
    const response = await api.get(`/stakeholders/${id}`);
    return response.data;
  },

  createStakeholder: async (stakeholderData) => {
    const response = await api.post('/stakeholders', stakeholderData);
    return response.data;
  },

  bulkCreateStakeholders: async (stakeholdersData) => {
    const response = await api.post('/stakeholders/bulk', stakeholdersData);
    return response.data;
  },

  updateStakeholder: async (id, stakeholderData) => {
    const response = await api.put(`/stakeholders/${id}`, stakeholderData);
    return response.data;
  },

  deleteStakeholder: async (id) => {
    const response = await api.delete(`/stakeholders/${id}`);
    return response.data;
  }
};

export default stakeholderService;