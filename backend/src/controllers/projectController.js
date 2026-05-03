const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllProjects = async (req, res, next) => {
  try {
    const where = req.user.role === 'ADMIN'
      ? {}
      : { members: { some: { userId: req.user.id } } };

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ projects });
  } catch (err) { next(err); }
};

const getProject = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check access
    if (req.user.role !== 'ADMIN') {
      const isMember = project.members.some(m => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ project });
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name, description,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } }
      }
    });
    res.status(201).json({ project });
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
      include: { owner: { select: { id: true, name: true, email: true } } }
    });
    res.json({ project });
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { next(err); }
};

const addMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const { email, role } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } }
    });
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    res.status(201).json({ member });
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = { getAllProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
