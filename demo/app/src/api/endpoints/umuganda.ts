import apiClient from '../client';

/** Upcoming Umuganda days plus a summary of the next one. */
export const getUmugandaDays = async (params = {}) => {
  const { data } = await apiClient.get('/umuganda', { params });
  return data;
};

/** One month of calendar intelligence: Umuganda days + every event in the month. */
export const getUmugandaCalendar = async (year: number, month: number) => {
  const { data } = await apiClient.get('/umuganda/calendar', { params: { year, month } });
  return data;
};

/** Public Umuganda notices, newest first. */
export const getUmugandaNotices = async (limit = 20) => {
  const { data } = await apiClient.get('/umuganda/notices', { params: { limit } });
  return data;
};

/** A single Umuganda day with its events, affected and rescheduled matches. */
export const getUmugandaDay = async (id: number | string) => {
  const { data } = await apiClient.get(`/umuganda/${id}`);
  return data;
};

/** Every upcoming fixture that collides with an Umuganda day. Admin only. */
export const getUmugandaConflicts = async (months = 6) => {
  const { data } = await apiClient.get('/umuganda/conflicts', { params: { months } });
  return data;
};

export const createUmugandaDay = async (payload: any) => {
  const { data } = await apiClient.post('/umuganda', payload);
  return data;
};

export const updateUmugandaDay = async (id: number | string, payload: any) => {
  const { data } = await apiClient.patch(`/umuganda/${id}`, payload);
  return data;
};

export const deleteUmugandaDay = async (id: number | string) => {
  const { data } = await apiClient.delete(`/umuganda/${id}`);
  return data;
};

/** Generate the expected (last-Saturday) dates for the coming months. */
export const generateUmugandaDates = async (months = 12) => {
  const { data } = await apiClient.post('/umuganda/generate', { months });
  return data;
};

export const createUmugandaAnnouncement = async (id: number | string, payload: any) => {
  const { data } = await apiClient.post(`/umuganda/${id}/announcement`, payload);
  return data;
};

/**
 * Record the administrator's ruling on a clashing match.
 * `kind` is 'league' or 'amashuri'; `decision` is one of
 * CONTINUE | MOVED | AFTER_UMUGANDA | AFFECTED.
 */
export const setUmugandaDecision = async (
  kind: 'league' | 'amashuri',
  id: number | string,
  payload: { decision: string; newDate?: string | null; reason?: string | null },
) => {
  const { data } = await apiClient.post(`/umuganda/events/${kind}/${id}/decision`, payload);
  return data;
};
