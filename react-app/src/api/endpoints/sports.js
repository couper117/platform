import apiClient from '../client';

export const getSports = async () => {
  const { data } = await apiClient.get('/sports');
  return data;
};
