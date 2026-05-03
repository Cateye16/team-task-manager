const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const now = new Date();

    // Project filter based on role
    const projectWhere = isAdmin ? {} : { members: { some: { userId } } };
    const taskWhere = isAdmin ? {} : {
      project: { members: { some: { userId } } }
    };

    const [
      totalProjects,
      totalTasks,
      myTasks,
      tasksByStatus,
      overdueTasks,
      recentTasks,
      upcomingTasks,
      projectStats
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, assigneeId: userId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { status: true }
      }),
      prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: now },
          status: { not: 'DONE' }
        }
      }),
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.task.findMany({
        where: {
          ...taskWhere,
          dueDate: { gte: now },
          status: { not: 'DONE' }
        },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      prisma.project.findMany({
        where: projectWhere,
        include: {
          _count: { select: { tasks: true } },
          tasks: {
            where: { status: 'DONE' },
            select: { id: true }
          }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const statusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasksByStatus.forEach(s => { statusMap[s.status] = s._count.status; });

    const projects = projectStats.map(p => ({
      id: p.id,
      name: p.name,
      totalTasks: p._count.tasks,
      completedTasks: p.tasks.length,
      progress: p._count.tasks > 0 ? Math.round((p.tasks.length / p._count.tasks) * 100) : 0
    }));

    res.json({
      stats: {
        totalProjects,
        totalTasks,
        myTasks,
        overdueTasks,
        todoTasks: statusMap.TODO,
        inProgressTasks: statusMap.IN_PROGRESS,
        doneTasks: statusMap.DONE
      },
      recentTasks,
      upcomingTasks,
      projects
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboard };
