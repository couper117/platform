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

// Amashuri sport tiles for the school hub (Phase 3 backend route).
export const getAkcSports = async () => {
  const { data } = await apiClient.get('/akc3/sports');
  return data;
};

// Amashuri announcements / school-sports news feed (Phase 3 backend route).
export const getAkcAnnouncements = async () => {
  const { data } = await apiClient.get('/akc3/announcements');
  return data;
};

// Student athletes across school teams; pass { verified: 'false' } for the
// pending-approval queue.
export const getAkcAthletes = async (params = {}) => {
  const { data } = await apiClient.get('/akc3/athletes', { params });
  return data;
};

// Approve an athlete's documents.
export const verifyAkcAthlete = async (id) => {
  const { data } = await apiClient.patch(`/akc3/admin/athletes/${id}/verify`, { docVerified: true });
  return data;
};

// --- Amashuri admin CRUD (add / edit / hide) ---
export const createAkcSchool = async (payload) => (await apiClient.post('/akc3/admin/schools', payload)).data;
export const updateAkcSchool = async (id, payload) => (await apiClient.put(`/akc3/admin/schools/${id}`, payload)).data;
export const setAkcSchoolActive = async (id, active) => (await apiClient.patch(`/akc3/admin/schools/${id}/active`, { active })).data;

export const createAkcTeam = async (payload) => (await apiClient.post('/akc3/admin/teams', payload)).data;
export const updateAkcTeam = async (id, payload) => (await apiClient.put(`/akc3/admin/teams/${id}`, payload)).data;
export const setAkcTeamActive = async (id, active) => (await apiClient.patch(`/akc3/admin/teams/${id}/active`, { active })).data;

export const createAkcAthlete = async (payload) => (await apiClient.post('/akc3/admin/athletes', payload)).data;
export const setAkcAthleteActive = async (id, active) => (await apiClient.patch(`/akc3/admin/athletes/${id}/active`, { active })).data;

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
