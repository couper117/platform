import apiClient from '../client';

export const getLeagues = async (params = {}) => {
  const { data } = await apiClient.get('/leagues', { params });
  return data;
};

export const getLeague = async (id) => {
  const { data } = await apiClient.get(`/leagues/${id}`);
  return data;
};
