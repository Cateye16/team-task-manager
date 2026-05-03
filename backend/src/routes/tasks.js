const express = require('express');
const { body } = require('express-validator');
const { getProjectTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Tasks by project
router.get('/project/:projectId', getProjectTasks);

router.get('/:id', getTask);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('projectId').notEmpty().withMessage('Project ID is required').isInt(),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assigneeId').optional().isInt()
], createTask);

router.put('/:id', [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('assigneeId').optional({ nullable: true }).isInt()
], updateTask);

router.delete('/:id', deleteTask);

module.exports = router;
