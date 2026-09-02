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

// --- School roster form (the document a school fills in) ---

// Blank registration form for one school team. The returned CSV carries a
// "# key: value" header naming the school and team, so the filled file re-imports
// with nothing to configure.
export const downloadRosterForm = async (schoolId, params) => {
  const { data } = await apiClient.get(`/akc3/admin/schools/${schoolId}/roster-form`, {
    params,
    responseType: 'blob',
  });
  return data;
};

// --- School coordinator accounts ---
export const getSchoolCoordinators = async (schoolId) =>
  (await apiClient.get(`/akc3/admin/schools/${schoolId}/coordinators`)).data;

export const createSchoolCoordinator = async (schoolId, payload) =>
  (await apiClient.post(`/akc3/admin/schools/${schoolId}/coordinators`, payload)).data;

export const setCoordinatorActive = async (userId, active) =>
  (await apiClient.patch(`/akc3/admin/coordinators/${userId}/active`, { active })).data;

// --- School portal (scoped to the signed-in coordinator's own school) ---
export const getMySchool = async () => (await apiClient.get('/akc3/school/me')).data;

export const getMySchoolAthletes = async (params = {}) =>
  (await apiClient.get('/akc3/school/athletes', { params })).data;

export const downloadMyRosterForm = async (params) => {
  const { data } = await apiClient.get('/akc3/school/roster-form', { params, responseType: 'blob' });
  return data;
};

export const importMyRoster = async (file, { dryRun = false } = {}) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('dryRun', String(dryRun));
  const { data } = await apiClient.post('/akc3/school/import', fd);
  return data;
};

// --- Retrospective guardian consent (Law N° 058/2021 art. 9) ---

export const getConsentBacklog = async () =>
  (await apiClient.get('/akc3/admin/consent/backlog')).data;

export const getSchoolConsentStatus = async (schoolId) =>
  (await apiClient.get(`/akc3/admin/schools/${schoolId}/consent`)).data;

export const downloadConsentForm = async (schoolId) => {
  const { data } = await apiClient.get(`/akc3/admin/schools/${schoolId}/consent-form`, { responseType: 'blob' });
  return data;
};

export const importConsentForm = async (file, { dryRun = false } = {}) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('dryRun', String(dryRun));
  return (await apiClient.post('/akc3/admin/consent/import', fd)).data;
};

// School-side equivalents, scoped to the coordinator's own school.
export const getMyConsentStatus = async () => (await apiClient.get('/akc3/school/consent')).data;

export const downloadMyConsentForm = async () => {
  const { data } = await apiClient.get('/akc3/school/consent-form', { responseType: 'blob' });
  return data;
};

export const importMyConsentForm = async (file, { dryRun = false } = {}) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('dryRun', String(dryRun));
  return (await apiClient.post('/akc3/school/consent/import', fd)).data;
};

// --- Bulk athlete import ---

// Uploads the raw .csv and lets the server parse it, so quoted commas and
// spreadsheet quirks are handled in one place. `dryRun` validates the whole file
// and returns the same report without writing anything.
export const importAkcPlayers = async (file, { dryRun = false } = {}) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('dryRun', String(dryRun));
  const { data } = await apiClient.post('/akc3/admin/import/players', fd);
  return data;
};

// A blank CSV with the exact headings the importer expects, plus an example row.
export const downloadAkcImportTemplate = async () => {
  const { data } = await apiClient.get('/akc3/admin/import/template', { responseType: 'blob' });
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

export const getAkcTeam = async (id) => {
  const { data } = await apiClient.get(`/akc3/teams/${id}`);
  return data;
};

export const getAkcAthlete = async (id) => {
  const { data } = await apiClient.get(`/akc3/athletes/${id}`);
  return data;
};
