import axiosInstance from './axiosInstance';

export const getDashboardStatsApi = () =>
  axiosInstance.get('/reports/dashboard-stats');

export const getReportsApi = (params) =>
  axiosInstance.get('/reports', { params });
