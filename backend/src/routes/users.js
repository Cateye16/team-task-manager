const express = require('express');
const { body } = require('express-validator');
const { getAllUsers, getUser, updateRole } = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.patch('/:id/role', requireAdmin, [
  body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')
], updateRole);

module.exports = router;
