import apiClient from '../client';

export const getFixtures = async (params = {}) => {
  const { data } = await apiClient.get('/fixtures', { params });
  return data;
};

export const getFixture = async (id) => {
  const { data } = await apiClient.get(`/fixtures/${id}`);
  return data;
};

export const getLiveScores = async () => {
  const { data } = await apiClient.get('/fixtures', { params: { status: 'LIVE' } });
  return data;
};
