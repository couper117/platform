const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Superadmin
  const hashedPassword = await bcrypt.hash('Manager@123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      email: 'admin@rnsp.rw',
      role: 'SUPERADMIN',
      active: true,
      verified: true,
    },
  });

  // 2. Create Sports
  const sportsData = [
    { name: 'Football', icon: '⚽', category: 'FIELD', sortOrder: 1 },
    { name: 'Basketball', icon: '🏀', category: 'COURT', sortOrder: 2 },
    { name: 'Volleyball', icon: '🏐', category: 'COURT', sortOrder: 3 },
    { name: 'Rugby', icon: '🏉', category: 'FIELD', sortOrder: 4 },
    { name: 'Handball', icon: '🤾', category: 'COURT', sortOrder: 5 },
    { name: 'Tennis', icon: '🎾', category: 'RACKET', sortOrder: 6 },
    { name: 'Table Tennis', icon: '🏓', category: 'RACKET', sortOrder: 7 },
    { name: 'Athletics', icon: '🏃', category: 'TRACK', sortOrder: 8 },
    { name: 'Cycling', icon: '🚴', category: 'TRACK', sortOrder: 9 },
    { name: 'Rally', icon: '🏎️', category: 'OTHER', sortOrder: 10 },
    { name: 'Swimming', icon: '🏊', category: 'WATER', sortOrder: 11 },
    { name: 'Boxing', icon: '🥊', category: 'COMBAT', sortOrder: 12 },
    { name: 'Taekwondo', icon: '🥋', category: 'COMBAT', sortOrder: 13 },
    { name: 'Judo', icon: '🥋', category: 'COMBAT', sortOrder: 14 },
    { name: 'Cricket', icon: '🏏', category: 'FIELD', sortOrder: 15 },
  ];

  for (const s of sportsData) {
    await prisma.sport.upsert({
      where: { name: s.name },
      update: {},
      create: {
        ...s,
        slug: s.name.toLowerCase().replace(' ', '-'),
      },
    });
  }

  const football = await prisma.sport.findUnique({ where: { name: 'Football' } });

  // 3. Federations
  const federations = [
    { name: 'Federation Rwandaise de Football Association', abbreviation: 'FERWAFA', sportId: football.id },
    { name: 'Rwanda Basketball Federation', abbreviation: 'FERWABA' },
    { name: 'Rwanda Volleyball Federation', abbreviation: 'FRVB' },
  ];

  for (const f of federations) {
    await prisma.federation.create({ data: f });
  }

  // 4. Venues
  const venues = [
    { name: 'Amahoro National Stadium', city: 'Kigali', province: 'Kigali City', capacity: 45000 },
    { name: 'Kigali Arena', city: 'Kigali', province: 'Kigali City', capacity: 10000 },
    { name: 'Huye Stadium', city: 'Butare', province: 'Southern Province', capacity: 15000 },
  ];

  for (const v of venues) {
    await prisma.venue.create({ data: v });
  }

  // 5. Settings
  const settings = [
    { skey: 'site_name', sval: 'Rwanda National Sports Platform', label: 'Site Name', grp: 'branding' },
    { skey: 'contact_email', sval: 'info@rnsp.rw', label: 'Contact Email', grp: 'contact' },
    { skey: 'hero_title', sval: 'Excellence in Rwandan Sports', label: 'Hero Title', grp: 'homepage' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { skey: s.skey },
      update: {},
      create: s,
    });
  }

  // 6. Teams
  const teams = [
    { name: 'APR FC', shortName: 'APR', sportId: football.id, city: 'Kigali', status: 'VERIFIED' },
    { name: 'Rayon Sports', shortName: 'RS', sportId: football.id, city: 'Nyanza', status: 'VERIFIED' },
    { name: 'AS Kigali', shortName: 'ASK', sportId: football.id, city: 'Kigali', status: 'VERIFIED' },
  ];

  for (const t of teams) {
    await prisma.team.create({
      data: {
        ...t,
        slug: t.name.toLowerCase().replace(' ', '-'),
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
