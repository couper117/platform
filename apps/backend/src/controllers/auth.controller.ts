const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyToken, hashToken } = require('../utils/jwt');
const { sendMail } = require('../utils/sendMail');
const logActivity = require('../utils/activityLogger');
const env = require('../config/env');
const { capabilitiesFor } = require('../services/capabilities.rules');

// Attach the sport a federation admin is scoped to, so the frontend can filter
// its admin views to that sport.
const withAdminSport = async (user) => {
  if (user?.role === 'FEDERATION_ADMIN') {
    const fa = await prisma.federationAdminAssignment.findFirst({
      where: { userId: user.id },
      include: { federation: { include: { sport: { select: { id: true, name: true, slug: true, type: true } } } } },
    });
    user.sportId = fa?.federation?.sportId ?? null;
    user.sport = fa?.federation?.sport ?? null;
  }

  // A league admin is scoped to the leagues they were assigned to, the same way
  // a federation admin is scoped to a sport — but nothing ever sent that, so the
  // frontend's useAdminLeague() fell through to "the first league in the list".
  // Their whole portal then operated on somebody else's competition: standings,
  // reporters and match reports for a league they do not administer, and — now
  // that the write paths check the assignment — a 403 on their own pages.
  if (user?.role === 'LEAGUE_ADMIN') {
    const assignments = await prisma.leagueAdminAssignment.findMany({
      where: { userId: user.id },
      include: { league: { select: { id: true, name: true, slug: true, sportId: true, season: true } } },
      orderBy: { leagueId: 'asc' },
    });
    user.leagues = assignments.map((a) => a.league).filter(Boolean);
    user.leagueId = user.leagues[0]?.id ?? null;
  }

  return user;
};

/**
 * Send the account with the list of what it may do.
 *
 * The frontend has been deciding which admin menus to draw from the role name,
 * which means the same policy is written twice — once here and once in the
 * browser — and the two drift the moment a role changes. Sending the resolved
 * capabilities makes the server the only place the policy lives; the UI just
 * renders it.
 *
 * This is presentation only. Hiding a button is a courtesy, not a control: every
 * route still gates on requireCapability, so a capability list edited in a
 * console buys nothing.
 *
 * The raw grant/revoke arrays are dropped from the payload — they are the
 * mechanism, and only capabilitiesFor() knows how to combine them correctly.
 */
const withCapabilities = (user) => {
  if (!user) return user;
  user.capabilities = capabilitiesFor(user);
  delete user.grantedCapabilities;
  delete user.revokedCapabilities;
  delete user.resetTokenHash;
  delete user.resetTokenExpiry;
  return user;
};

// @desc    Register a team and its manager
// @route   POST /api/v1/auth/team/register
// @access  Public
const registerTeam = async (req, res, next) => {
  const {
    username, password, fullName, email, phone,
    teamName, shortName, sportId, city, district, province,
    homeVenue, foundedYear, registrationNo, primaryColor, secondaryColor, description,
    officials,
  } = req.body;

  try {
    const userExists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this username or email already exists' });
    }

    // Officials arrive as an array of { role, fullName, phone, email }. Keep only
    // the ones with a name so empty rows from the form are ignored.
    const officialRows = Array.isArray(officials)
      ? officials.filter((o) => o && o.fullName && String(o.fullName).trim())
      : [];

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
          shortName: shortName || null,
          sportId: parseInt(sportId),
          city,
          district: district || null,
          province,
          homeVenue: homeVenue || null,
          foundedYear: foundedYear ? parseInt(foundedYear) : null,
          registrationNo: registrationNo || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          description: description || null,
          email: email || null,
          phone: phone || null,
          managerUserId: user.id,
          status: 'PENDING',
          officials: officialRows.length
            ? {
                create: officialRows.map((o) => ({
                  role: o.role || 'OTHER',
                  fullName: String(o.fullName).trim(),
                  phone: o.phone || null,
                  email: o.email || null,
                  idNumber: o.idNumber || null,
                })),
              }
            : undefined,
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
  const { username, email, password } = req.body;

  try {
    // Accept either a username or an email address as the identifier. Admins are
    // invited by email, so they may sign in with it. Email match is
    // case-insensitive; username match is exact.
    const identifier = String(email || username || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
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

    // Save hashed refresh token to DB (never store the raw token)
    await prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
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
    await withAdminSport(user);
    withCapabilities(user);

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
      where: { token: hashToken(token) },
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
          token: hashToken(newRefreshToken),
          userId: savedToken.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token: hashToken(token) } });
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { managedTeam: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = undefined;
    await withAdminSport(user);
    withCapabilities(user);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset link
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

    // Only send when the user exists, but always return the same response to
    // avoid leaking which emails are registered.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const link = `${env.FRONTEND_URL}/auth/reset-password?token=${rawToken}&uid=${user.id}`;
      await sendMail({
        to: email,
        subject: 'Reset your RwaSport password',
        text: `Reset your password: ${link} (valid for 1 hour). If you didn't request this, ignore this email.`,
        html: `<p>Reset your RwaSport password:</p><p><a href="${link}">${link}</a></p><p>This link is valid for 1 hour.</p>`,
      });
    }
    res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset a password using a token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, uid, newPassword } = req.body;
    if (!token || !uid || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid request or password too short' });
    }
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: { id: parseInt(uid, 10), resetTokenHash, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetTokenHash: null, resetTokenExpiry: null },
    });
    // Invalidate all existing sessions on password change.
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerTeam,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
