const slugify = require('slugify');
const prisma = require('../config/db');

/**
 * Generate a slug from `name` that is unique for the given Prisma model.
 * Appends -2, -3, ... on collision. `excludeId` lets updates keep their slug.
 */
const uniqueSlug = async (model, name, excludeId = null) => {
  const base = slugify(name || 'item', { lower: true, strict: true }) || 'item';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma[model].findFirst({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

module.exports = { uniqueSlug };
