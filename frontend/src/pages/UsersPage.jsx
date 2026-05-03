import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    if (!confirm(`Change this user to ${newRole}?`)) return;
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>{users.length} registered users</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent2)', background: 'rgba(108,99,255,0.1)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(108,99,255,0.2)' }}>
          <Shield size={14} /> Admin View
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{getInitials(u.name)}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                      {u.id === currentUser?.id && <span style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 700 }}>YOU</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.id !== currentUser?.id && (
                      <button
                        className={`btn btn-sm ${u.role === 'ADMIN' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleRole(u.id, u.role)}>
                        {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
