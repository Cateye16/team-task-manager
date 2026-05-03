const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskflow_secret_key');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId || req.params.id || req.body.projectId);
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    // Global admins bypass project-level check
    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Project admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId || req.params.id || req.body.projectId);
    if (!projectId) return next();

    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin, requireProjectMember };
