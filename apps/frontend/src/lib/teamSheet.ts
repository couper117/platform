/**
 * Who named a side — the one fact both portals ask about the same row.
 *
 * A team sheet is written by a coach from the club portal or by a reporter from
 * the touchline, and until `MatchTeamSheet.submittedById` existed the two were
 * indistinguishable. That gap showed on both screens at once: the reporter's
 * could only say "sheet on file" where it wanted to say "the coach filed this",
 * and a coach could not tell whether the eleven against their club was their own
 * filing or somebody's transcription of it.
 *
 * It lives in its own file rather than in lib/coachMatch or lib/reporterMatch
 * because it belongs to neither: it is the seam between them, and putting it in
 * one would have meant the other importing a module written for a role it does
 * not hold.
 */

export type SheetAuthor = 'coach' | 'reporter' | 'admin' | 'unknown' | null;

/**
 * The author, drawn from the record rather than guessed.
 *
 * `unknown` is returned for a sheet written before the column existed, and it is
 * the honest answer — which is why neither portal may say "you filed this" on
 * the strength of merely knowing that somebody did.
 */
export const sheetAuthor = (sheet: any): SheetAuthor => {
  if (!sheet) return null;
  const role = sheet.submittedBy?.role;
  if (!role) return 'unknown';
  if (role === 'TEAM_MANAGER') return 'coach';
  if (role === 'MATCH_REPORTER') return 'reporter';
  return 'admin';
};

/**
 * How each portal says it.
 *
 * Deliberately different wording per audience for the same underlying fact: to a
 * coach, a reporter-written sheet is "recorded by the reporter"; to a reporter,
 * a coach-written one is "filed by the coach" and their own is "you recorded
 * this". Same row, two readers, and neither is served by a neutral phrasing.
 */
export const AUTHOR_LABEL: Record<string, { coach: string; reporter: string }> = {
  coach: { coach: 'Filed by your club', reporter: 'Filed by the coach' },
  reporter: { coach: 'Recorded by the reporter', reporter: 'Recorded by a reporter' },
  admin: { coach: 'Filed by a league admin', reporter: 'Filed by a league admin' },
  unknown: { coach: 'On file', reporter: 'On file' },
};

/** The label for a sheet, read by `audience`. */
export const authorLabel = (sheet: any, audience: 'coach' | 'reporter') =>
  AUTHOR_LABEL[sheetAuthor(sheet) || 'unknown'][audience];

/** The name behind the label, where there is one worth showing. */
export const authorName = (sheet: any): string | null =>
  sheet?.submittedBy?.fullName || null;
