import apiClient from '../client';

export const getPlayers = async (params = {}) => {
  const { data } = await apiClient.get('/players', { params });
  return data;
};

export const getPlayer = async (id) => {
  const { data } = await apiClient.get(`/players/${id}`);
  return data;
};
