import apiClient from '../client';

export const getSports = async () => {
  const { data } = await apiClient.get('/sports');
  return data;
};

export const getSport = async (slug) => {
  const { data } = await apiClient.get(`/sports/${slug}`);
  return data;
};
