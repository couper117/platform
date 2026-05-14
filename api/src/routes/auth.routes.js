const express = require('express');
const { registerTeam, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { z } = require('zod');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    fullName: z.string().min(3),
    email: z.string().email(),
    phone: z.string().optional(),
    teamName: z.string().min(2),
    sportId: z.union([z.string(), z.number()]),
    city: z.string().optional(),
    province: z.string().optional(),