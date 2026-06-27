import axiosInstance from './axiosInstance';

export const getAlertsApi = (params) =>
  axiosInstance.get('/alerts', { params });

export const acknowledgeAlertApi = (id) =>
  axiosInstance.patch(`/alerts/${id}/acknowledge`);

export const resolveAlertApi = (id, data) =>
  axiosInstance.patch(`/alerts/${id}/resolve`, data);

export const getAlertByIdApi = (id) =>
  axiosInstance.get(`/alerts/${id}`);
