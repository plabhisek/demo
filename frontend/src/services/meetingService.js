import api from './api';

const meetingService = {
  getAllMeetings: async (params = {}) => {
    const response = await api.get('/meetings', { params });
    return response.data;
  },

  getMeetingById: async (id) => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  createMeeting: async (meetingData) => {
    // Ensure assignedToIds is an array
    if (!Array.isArray(meetingData.assignedToIds)) {
      meetingData.assignedToIds = [meetingData.assignedToIds];
    }
    
    const response = await api.post('/meetings', meetingData);
    return response.data;
  },

  updateMeeting: async (id, meetingData) => {
    // Ensure assignedToIds is an array
    if (meetingData.assignedToIds && !Array.isArray(meetingData.assignedToIds)) {
      meetingData.assignedToIds = [meetingData.assignedToIds];
    }
    
    const response = await api.put(`/meetings/${id}`, meetingData);
    return response.data;
  },


  deleteMeeting: async (id) => {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  },

  // MoM (Minutes of Meeting) related methods
  addMinutesOfMeeting: async (meetingId, momData) => {
    const response = await api.post(`/meetings/${meetingId}/mom`, momData);
    return response.data;
  },

  addMissedReason: async (meetingId, reasonData) => {
    try {
      const response = await api.post(`/meetings/${meetingId}/missed`, reasonData);
      return response.data;
    } catch (error) {
      console.error('Error in addMissedReason:', error);
      throw error;
    }
  },

  sendReminderManually: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/send-reminder`);
    return response.data;
  },

  sendCheckInManually: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/send-checkin`);
    return response.data;
  },

  // MoM (Minutes of Meeting) related methods
  createMoM: async (meetingId, momData) => {
    const response = await api.post(`/meetings/${meetingId}/mom`, momData);
    return response.data;
  },

  getMoMByMeetingId: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/mom`);
    return response.data;
  },

  updateMoM: async (meetingId, momId, momData) => {
    const response = await api.put(`/meetings/${meetingId}/mom/${momId}`, momData);
    return response.data;
  }
};

export default meetingService;