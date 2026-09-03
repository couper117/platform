import apiClient from '../client';

/**
 * The signed-in account itself, whatever portal it is signed into.
 *
 * These write `User`, not a role's profile row, which is why they are here and
 * not in reporter.ts — where the photograph first shipped, gated on
 * `reporters.profile`, effectively saying that only a match reporter may have a
 * face. The club portal needs the identical control for a coach, so the endpoint
 * moved to the account rather than being copied.
 */

/**
 * Replace your photograph.
 *
 * Returns `{ id, avatar }`. Callers are expected to follow it with the auth
 * store's `syncUser()`, because the account menu and the sidebar read the avatar
 * from the stored user rather than from any page's query.
 */
export const uploadMyAvatar = async (file: File) => {
  const body = new FormData();
  body.append('avatar', file);
  // No explicit Content-Type: the browser has to set the multipart boundary, and
  // naming the header here would overwrite it with one that has none.
  const { data } = await apiClient.put('/auth/me/avatar', body);
  return data.data;
};

export const removeMyAvatar = async () => {
  const { data } = await apiClient.delete('/auth/me/avatar');
  return data.data;
};
