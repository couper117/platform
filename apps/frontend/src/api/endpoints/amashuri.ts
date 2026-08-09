import apiClient from '../client';

// Amashuri Games (Rwanda Inter-School Sports) — backend still served under /akc3/*.

export const getSchools = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/schools', { params });
  return data;
};

export const getSchool = async (id) => {
  const { data } = await apiClient.get(`/akc3/schools/${id}`);
  return data;
};

export const getAkcTeams = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/teams', { params });
  return data;
};

export const getAkcFixtures = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/fixtures', { params });
  return data;
};

export const getAkcFixture = async (id) => {
  const { data } = await apiClient.get(`/akc3/fixtures/${id}`);
  return data;
};

export const getAkcStandings = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/standings', { params });
  return data;
};

export const getChampionships = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/competitions', { params });
  return data;
};

// --- Admin (SUPERADMIN) ---
export const createChampionship = async (payload) => {
  const { data } = await apiClient.post('/akc3/admin/competitions', payload);
  return data;
};

export const updateChampionship = async (id, payload) => {
  const { data } = await apiClient.put(`/akc3/admin/competitions/${id}`, payload);
  return data;
};

export const deleteChampionship = async (id) => {
  const { data } = await apiClient.delete(`/akc3/admin/competitions/${id}`);
  return data;
};
