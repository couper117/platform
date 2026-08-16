/**
 * Parse ?page & ?limit into Prisma skip/take. Backward compatible: when NEITHER
 * page nor limit is supplied, returns take: undefined (no limit) so existing
 * full-list consumers keep working. When either is supplied, paginates
 * (default limit 20, max 100).
 */
const getPagination = (query: any = {}, defaultLimit = 20, maxLimit = 100) => {
  const wants = query.page != null || query.limit != null;
  if (!wants) return { skip: 0, take: undefined, page: 1, limit: null, active: false };
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { skip: (page - 1) * limit, take: limit, page, limit, active: true };
};

module.exports = { getPagination };
