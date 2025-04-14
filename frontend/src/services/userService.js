import api from './api';

const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get users by department
  getUsersByDepartment: async (department) => {
    const response = await api.get('/users', { params: { department } });
    return response.data;
  }
};

export default userService;