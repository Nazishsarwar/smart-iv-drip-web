import axiosInstance from './axiosInstance';

export const getDevicesApi = (params) =>
  axiosInstance.get('/devices', { params });

export const getDeviceByIdApi = (id) =>
  axiosInstance.get(`/devices/${id}`);

export const registerDeviceApi = (data) =>
  axiosInstance.post('/devices', data);

export const updateDeviceApi = (id, data) =>
  axiosInstance.put(`/devices/${id}`, data);

export const deleteDeviceApi = (id) =>
  axiosInstance.delete(`/devices/${id}`);

export const unassignDeviceApi = (id) =>
  axiosInstance.post(`/devices/${id}/unassign`);
