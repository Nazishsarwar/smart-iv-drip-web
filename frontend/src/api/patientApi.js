import axiosInstance from './axiosInstance';

export const getPatientsApi = (params) =>
  axiosInstance.get('/patients', { params });

export const getPatientByIdApi = (id) =>
  axiosInstance.get(`/patients/${id}`);

export const createPatientApi = (data) =>
  axiosInstance.post('/patients', data);

export const updatePatientApi = (id, data) =>
  axiosInstance.put(`/patients/${id}`, data);

export const deletePatientApi = (id) =>
  axiosInstance.delete(`/patients/${id}`);

export const startSessionApi = (patientId, data) =>
  axiosInstance.post(`/patients/${patientId}/sessions/start`, data);

export const endSessionApi = (patientId, sessionId, data) =>
  axiosInstance.post(`/patients/${patientId}/sessions/${sessionId}/end`, data);
