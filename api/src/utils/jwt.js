const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      teamId: user.managedTeam ? user.managedTeam.id : null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id },
    env.JWT_SECRET, // In a more robust setup, use a different secret for refresh tokens
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
