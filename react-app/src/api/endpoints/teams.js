import apiClient from '../client';

export const getTeams = async (params = {}) => {
  const { data } = await apiClient.get('/teams', { params });
  return data;
};

export const getTeam = async (id) => {
  const { data } = await apiClient.get(`/teams/${id}`);
  return data;
};
