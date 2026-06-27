import axiosInstance from './axiosInstance';

export const getNursesApi = (params) =>
  axiosInstance.get('/nurses', { params });

export const getNurseByIdApi = (id) =>
  axiosInstance.get(`/nurses/${id}`);

export const createNurseApi = (data) =>
  axiosInstance.post('/nurses', data);

export const updateNurseApi = (id, data) =>
  axiosInstance.put(`/nurses/${id}`, data);

export const deactivateNurseApi = (id) =>
  axiosInstance.patch(`/nurses/${id}/deactivate`);

export const assignPatientsApi = (id, patientIds) =>
  axiosInstance.post(`/nurses/${id}/assign-patients`, { patientIds });
