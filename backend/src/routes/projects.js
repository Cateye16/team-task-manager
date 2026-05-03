const express = require('express');
const { body } = require('express-validator');
const {
  getAllProjects, getProject, createProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { authenticate, requireAdmin, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 })
], createProject);

router.get('/:id', getProject);
router.put('/:id', requireProjectAdmin, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 })
], updateProject);
router.delete('/:id', requireProjectAdmin, deleteProject);

// Member management
router.post('/:id/members', requireProjectAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['ADMIN', 'MEMBER'])
], addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);

module.exports = router;
