import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, X, Trash2 } from 'lucide-react';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(res.data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Project</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="input" placeholder="e.g. Marketing Campaign Q1" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" placeholder="What is this project about?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectCard({ project, onDelete, isAdmin }) {
  const completedTasks = project.tasks?.filter(t => t.status === 'DONE').length || 0;
  const totalTasks = project._count?.tasks || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{project.name}</h3>
          </Link>
          {project.description && <p className="text-muted text-sm" style={{ lineHeight: 1.5 }}>{project.description}</p>}
        </div>
        {isAdmin && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(project.id, project.name)}>
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
          <span>Progress</span>
          <span style={{ fontFamily: 'Space Mono' }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
          <Users size={14} /> {project.members?.length || 0} members
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono' }}>
          {totalTasks} tasks
        </div>
      </div>

      <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
        View Project →
      </Link>
    </div>
  );
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data.projects)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its tasks?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x.id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <p>No projects yet. Create your first one!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={handleDelete} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
