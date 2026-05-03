import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { Plus, UserPlus, ArrowLeft, Trash2, Edit2, X } from 'lucide-react';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function TaskModal({ task, projectMembers, projectId, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task?.assigneeId || '',
    projectId
  });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null };
      const res = isEdit
        ? await api.put(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload);
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onSaved(res.data.task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="input" placeholder="Task title" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" placeholder="Task details..." value={form.description} onChange={set('description')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={form.status} onChange={set('status')}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="select" value={form.priority} onChange={set('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="select" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onAdded(res.data.member);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Add Member</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="input" type="email" placeholder="member@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role in Project</label>
            <select className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'var(--text3)' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'var(--yellow)' },
  { key: 'DONE', label: 'Done', color: 'var(--green)' }
];

function KanbanCard({ task, onClick, onDelete, canDelete }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''}`} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div className="task-title">{task.title}</div>
        {canDelete && (
          <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }}
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 size={11} />
          </button>
        )}
      </div>
      <div className="task-meta">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="avatar avatar-sm">{getInitials(task.assignee.name)}</div>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{task.assignee.name}</span>
          </div>
        )}
        {task.dueDate && (
          <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)', fontFamily: 'Space Mono', marginLeft: 'auto' }}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then(res => setProject(res.data.project)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!project) return <div className="page"><p>Project not found</p></div>;

  const tasksByStatus = {};
  COLUMNS.forEach(c => { tasksByStatus[c.key] = project.tasks.filter(t => t.status === c.key); });

  const membership = project.members.find(m => m.userId === user.id);
  const isProjectAdmin = isAdmin || membership?.role === 'ADMIN';

  const handleTaskSaved = (savedTask) => {
    setProject(prev => {
      const existing = prev.tasks.find(t => t.id === savedTask.id);
      return {
        ...prev,
        tasks: existing
          ? prev.tasks.map(t => t.id === savedTask.id ? savedTask : t)
          : [savedTask, ...prev.tasks]
      };
    });
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.userId !== userId) }));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link to="/projects" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /> Projects</Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="text-muted text-sm" style={{ marginTop: 4 }}>{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isProjectAdmin && (
            <button className="btn btn-secondary" onClick={() => setShowAddMember(true)}><UserPlus size={16} /> Add Member</button>
          )}
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}><Plus size={16} /> Add Task</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['board', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif',
              color: activeTab === tab ? 'var(--accent2)' : 'var(--text2)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="kanban">
          {COLUMNS.map(col => (
            <div className="kanban-col" key={col.key}>
              <div className="kanban-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="dot" style={{ background: col.color }} />
                  <span className="kanban-title" style={{ color: col.color }}>{col.label}</span>
                </div>
                <span className="kanban-count">{tasksByStatus[col.key].length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[col.key].length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No tasks</p>
                )}
                {tasksByStatus[col.key].map(task => (
                  <KanbanCard key={task.id} task={task}
                    onClick={() => setTaskModal(task)}
                    onDelete={handleDeleteTask}
                    canDelete={isProjectAdmin || task.creatorId === user.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Team Members ({project.members.length})</h3>
          {project.members.map(m => (
            <div className="member-row" key={m.id}>
              <div className="member-info">
                <div className="avatar">{getInitials(m.user.name)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                {isProjectAdmin && m.userId !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.userId)}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(taskModal === 'new' || (taskModal && typeof taskModal === 'object')) && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={parseInt(id)}
          projectMembers={project.members}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={m => setProject(prev => ({ ...prev, members: [...prev.members, m] }))}
        />
      )}
    </div>
  );
}
