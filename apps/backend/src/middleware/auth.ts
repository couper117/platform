const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/db');
const { can, canAll, canAny, assertKnown, capabilitiesFor } = require('../services/capabilities.rules');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { managedTeam: true },
    });

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!req.user.active) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    // A federation admin is scoped to a single sport (via their federation).
    // Attach it so controllers can enforce "own sport only".
    if (req.user.role === 'FEDERATION_ADMIN') {
      const fa = await prisma.federationAdminAssignment.findFirst({
        where: { userId: req.user.id },
        include: { federation: { select: { sportId: true } } },
      });
      req.user.sportId = fa?.federation?.sportId ?? null;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

/**
 * Identify the caller when they present a valid token, but let anonymous requests
 * through untouched.
 *
 * Public endpoints that show more to a privileged caller need this: `protect`
 * would reject the public, and without any auth step `req.user` is always empty,
 * so an administrator would be served the redacted view of their own data. Any
 * problem with the token is treated as "not signed in" rather than an error —
 * this middleware never decides access, it only says who is asking.
 */
const attachUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (user?.active) req.user = user;
  } catch (error) {
    // Expired or forged token — carry on as an anonymous visitor.
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Gate a route on what the caller may *do*, rather than on which role they hold.
 *
 * `authorize('SUPERADMIN', 'LEAGUE_ADMIN', ...)` states the answer instead of
 * the question: every new role means editing every route that should include it,
 * and the reason a role is on the list is nowhere in the code. A capability says
 * why — and one account can be granted or refused it individually without
 * inventing a role for one person.
 *
 * `authorize` is deliberately left in place and still used. Both are honoured
 * where both appear, so this can be adopted route by route without a rewrite
 * that risks opening something up in passing.
 *
 * Capability names are validated as the routes are built, so a typo throws at
 * startup naming the string, rather than silently denying everyone at runtime.
 */
const requireCapability = (...capabilities) => {
  capabilities.forEach(assertKnown);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
    if (canAll(req.user, capabilities)) return next();

    const missing = capabilities.filter((c) => !can(req.user, c));
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to do this.',
      // Named so an administrator can grant exactly what is missing rather than
      // guessing, and so a developer sees which check failed.
      required: missing,
    });
  };
};

/** As requireCapability, but any one of the listed capabilities is enough. */
const requireAnyCapability = (...capabilities) => {
  capabilities.forEach(assertKnown);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
    if (canAny(req.user, capabilities)) return next();

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to do this.',
      required: capabilities,
    });
  };
};

module.exports = {
  protect,
  attachUser,
  authorize,
  requireCapability,
  requireAnyCapability,
  can,
  capabilitiesFor,
};
