const express = require('express');
const { 
  getLeagues, getLeague, createLeague, updateLeague, 
  deleteLeague, addTeamToLeague, removeTeamFromLeague 
} = require('../controllers/leagues.controller');
const { assignReporter } = require('../controllers/adminAssignments.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getLeagues);
router.get('/:id', getLeague);