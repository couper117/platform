const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  return { accessToken, refreshToken };
};

const verifyPassword = (password, hash) => {
  // Check bcrypt first (new hashes)
  if (hash.length === 60) {
    return bcrypt.compareSync(password, hash);
  }
  // Fallback to SHA256 (legacy PHP hashes)
  const sha256 = crypto.createHash('sha256').update(password).digest('hex');
  return sha256 === hash;
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If it was a legacy hash, the next save will bcrypt it due to pre-save hook
    if (user.password.length !== 60) {
      user.password = password;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id, user.role);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
    }
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name, phone } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password required' });
    }

    const user = new User({
      username,
      email,
      password, // Will be hashed by pre-save hook
      full_name: full_name || username,
      phone: phone || '',
      role: 'team_manager',
      active: true,
      verified: false
    });

    await user.save();

    res.status(201).json({ message: 'Registration successful', userId: user._id });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refresh, logout, me, register };
