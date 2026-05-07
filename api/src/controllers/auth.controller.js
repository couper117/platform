const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const logActivity = require('../utils/activityLogger');
const env = require('../config/env');

// @desc    Register a team and its manager
// @route   POST /api/v1/auth/team/register
// @access  Public
const registerTeam = async (req, res, next) => {
  const { username, password, fullName, email, phone, teamName, sportId, city, province } = req.body;

  try {
    const userExists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          fullName,
          email,
          phone,
          role: 'TEAM_MANAGER',
        },
      });

      const team = await tx.team.create({
        data: {
          name: teamName,
          sportId: parseInt(sportId),
          city,
          province,
          managerUserId: user.id,
          status: 'PENDING',
        },
      });

      return { user, team };
    });

    await logActivity({
      userId: result.user.id,
      action: 'Team Registration',
      detail: `Registered team ${teamName}`,
      module: 'auth',
      ip: req.ip,
    });
