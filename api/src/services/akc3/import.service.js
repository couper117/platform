const prisma = require('../../config/db');

const importPlayersFromCSV = async (rows) => {
  const results = { created: 0, skipped: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    try {
      const {
        schoolCode, sportId, gender, ageCategory,
        playerFullName, dob, position, jersey, idType, idNumber
      } = row;

      if (!schoolCode) throw new Error('Missing schoolCode');

      let school = await prisma.akcSchool.findFirst({ where: { code: schoolCode } });
      if (!school) {
        throw new Error(`School with code ${schoolCode} not found`);
      }

      let team = await prisma.akcTeam.findFirst({
        where: {
          schoolId: school.id,
          sportId: parseInt(sportId),
          gender: gender,
          ageCategory: ageCategory,
        }
      });

      if (!team) {
        team = await prisma.akcTeam.create({
          data: {
            schoolId: school.id,
            sportId: parseInt(sportId),