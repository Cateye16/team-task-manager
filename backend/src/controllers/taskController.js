const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getProjectTasks = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { status, priority, assigneeId } = req.query;

    // Enforce project-level RBAC
    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Access denied' });
    }

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = parseInt(assigneeId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ tasks });
  } catch (err) { next(err); }
};

const getTask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Enforce project-level RBAC
    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;

    // Enforce project-level RBAC — creator must be a project member
    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: parseInt(projectId), userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Access denied' });
    }

    // Verify assignee is project member if specified
    if (assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: parseInt(projectId), userId: parseInt(assigneeId) } }
      });
      if (!membership) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title, description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: parseInt(projectId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        creatorId: req.user.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });
    res.status(201).json({ task });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const id = parseInt(req.params.id);
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    // Enforce project-level RBAC
    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existingTask.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Access denied' });

      // Project admins can update any task; regular members only their own
      if (membership.role !== 'ADMIN' && existingTask.creatorId !== req.user.id && existingTask.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks you created or are assigned to' });
      }
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId ? parseInt(assigneeId) : null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });
    res.json({ task });
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Global admins can delete any task
    if (req.user.role === 'ADMIN') {
      await prisma.task.delete({ where: { id } });
      return res.json({ message: 'Task deleted successfully' });
    }

    // Task creators can delete their own tasks
    if (task.creatorId === req.user.id) {
      await prisma.task.delete({ where: { id } });
      return res.json({ message: 'Task deleted successfully' });
    }

    // Otherwise, must be project admin
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { getProjectTasks, getTask, createTask, updateTask, deleteTask };
