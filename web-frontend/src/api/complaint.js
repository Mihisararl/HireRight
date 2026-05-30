import api from '../utils/api';

export const createComplaint = async (payload) => {
  const response = await api.post('/complaints', payload);
  return response.data;
};

export const getUserComplaints = async () => {
  const response = await api.get('/complaints/my');
  return response.data;
};

export const getComplaintByServiceRequest = async (serviceRequestId) => {
  const response = await api.get(`/complaints/service/${serviceRequestId}`);
  return response.data;
};

export const reopenComplaint = async (complaintId) => {
  const response = await api.put(`/complaints/${complaintId}/reopen`);
  return response.data;
};
