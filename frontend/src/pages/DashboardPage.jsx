import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format, isPast } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, FolderKanban, ListTodo, TrendingUp, User } from 'lucide-react';

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="card stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-number" style={{ color }}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span className={`dot dot-${task.status.toLowerCase().replace('_', '')}`} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{task.project?.name}</div>
      </div>
      {isOverdue && <span className="badge badge-overdue">Overdue</span>}
      <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const { stats, recentTasks, upcomingTasks, projects } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>Here's what's happening today</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-4">
        <StatCard label="Total Projects" value={stats.totalProjects} color="var(--accent2)" icon={FolderKanban} />
        <StatCard label="My Tasks" value={stats.myTasks} color="var(--yellow)" icon={User} />
        <StatCard label="In Progress" value={stats.inProgressTasks} color="var(--orange)" icon={Clock} />
        <StatCard label="Overdue" value={stats.overdueTasks} color="var(--red)" icon={AlertCircle} />
      </div>

      {/* Task Status Bar */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Task Overview</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
            <span>Total: <strong style={{ color: 'var(--text)' }}>{stats.totalTasks}</strong></span>
            <span>Done: <strong style={{ color: 'var(--green)' }}>{stats.doneTasks}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 5, overflow: 'hidden' }}>
          {stats.totalTasks > 0 && <>
            <div style={{ width: `${(stats.todoTasks/stats.totalTasks)*100}%`, background: 'var(--text3)', borderRadius: '5px 0 0 5px' }} />
            <div style={{ width: `${(stats.inProgressTasks/stats.totalTasks)*100}%`, background: 'var(--yellow)' }} />
            <div style={{ width: `${(stats.doneTasks/stats.totalTasks)*100}%`, background: 'var(--green)', borderRadius: '0 5px 5px 0' }} />
          </>}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--text3)' }} /> Todo: {stats.todoTasks}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--yellow)' }} /> In Progress: {stats.inProgressTasks}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--green)' }} /> Done: {stats.doneTasks}</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Tasks */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="text-muted text-sm">No tasks yet</p>
          ) : recentTasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>

        {/* Projects Progress */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Project Progress</h3>
          {projects.length === 0 ? (
            <p className="text-muted text-sm">No projects yet</p>
          ) : projects.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text)'}>{p.name}</Link>
                <span className="text-muted" style={{ fontFamily: 'Space Mono', fontSize: 11 }}>{p.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.progress}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{p.completedTasks}/{p.totalTasks} tasks</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <div className="card mt-4">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Due Soon</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <Clock size={14} color="var(--yellow)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{t.title}</span>
                <span className="text-muted">{t.project?.name}</span>
                <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--yellow)' }}>
                  {format(new Date(t.dueDate), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
