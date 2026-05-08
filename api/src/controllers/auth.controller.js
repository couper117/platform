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

    res.status(201).json({
      success: true,
      message: 'Team registration submitted successfully. Awaiting approval.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { managedTeam: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await logActivity({
      userId: user.id,
      action: 'Login',
      detail: 'User logged in successfully',
      module: 'auth',
      ip: req.ip,
    });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { managedTeam: true } } },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const decoded = verifyToken(token);
    if (decoded.sub !== savedToken.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Refresh token rotation
    const newRefreshToken = generateRefreshToken(savedToken.user);
    const newAccessToken = generateAccessToken(savedToken.user);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: savedToken.id } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: savedToken.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),