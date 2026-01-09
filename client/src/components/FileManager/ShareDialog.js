import { useState, useEffect } from 'react';
import { useFiles } from '../../contexts/FileContext';
import { apiFetch } from '../../utils/api';

const API_URL = 'http://localhost:3000/api';

const ShareDialog = ({ file, onClose }) => {
  const { getPermissions, grantPermission, updatePermission, revokePermission } = useFiles();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('reader');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    loadPermissionsWithUsers();
  }, [file.id]);

  const loadPermissionsWithUsers = async () => {
    setLoading(true);
    try {
      const perms = await getPermissions(file.id);

      // Fetch theuser info for each permission
      const cache = { ...userCache };
      for (const perm of perms) {
        if (!cache[perm.userId]) {
          try {
            const response = await apiFetch(`/users/${perm.userId}`);
            if (response) {
              const data = await response.json();
              cache[perm.userId] = data;
            } else {
              cache[perm.userId] = { username: `User ${perm.userId}`, firstName: 'Unknown' };
            }
          } catch (err) {
            console.error(`Failed to fetch user ${perm.userId}:`, err);
            cache[perm.userId] = { username: `User ${perm.userId}`, firstName: 'Unknown' };
          }
        }
      }

      setUserCache(cache);
      setPermissions(perms);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e) => {
    e.preventDefault();
    setError('');

    if (!newUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    setAdding(true);
    try {
      // First, lookup for the user by username
      const response = await apiFetch(`/users/by-username/${newUsername.trim()}`);

      if (!response) {
        setError('Failed to lookup user');
        return;
      }

      if (response.status === 404) {
        setError('User not found');
        return;
      }

      const data = await response.json();
      const userId = data.id;

      // Then grant the permission
      await grantPermission(file.id, userId, newRole);
      await loadPermissionsWithUsers();
      setNewUsername('');
      setNewRole('reader');
    } catch (err) {
      setError(err.message || 'Failed to grant permission');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (permissionId, currentRole) => {
    const roles = ['reader', 'writer'];
    const currentIndex = roles.indexOf(currentRole);
    const nextRole = roles[(currentIndex + 1) % roles.length];

    try {
      await updatePermission(file.id, permissionId, nextRole);
      await loadPermissionsWithUsers();
    } catch (err) {
      console.error('Failed to update permission:', err);
      setError(err.message || 'Failed to update permission');
    }
  };

  const handleRevokePermission = async (permissionId) => {
    try {
      await revokePermission(file.id, permissionId);
      await loadPermissionsWithUsers();
    } catch (err) {
      console.error('Failed to revoke permission:', err);
      setError(err.message || 'Failed to revoke permission');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return '#1a73e8';
      case 'writer': return '#e37400';
      case 'reader': return '#5f6368';
      default: return '#5f6368';
    }
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="dialog-header">
          <h2 className="dialog-title">Share "{file.name}"</h2>
        </div>

        <div className="dialog-content" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {error && (
            <div className="error-message" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Add new person */}
          <form onSubmit={handleAddPermission} style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="username"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ minWidth: '120px' }}>
                <label
                  htmlFor="role"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  Role
                </label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="reader">Reader (View only)</option>
                  <option value="writer">Writer (Can edit)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="btn-primary"
                style={{
                  minWidth: '80px',
                  padding: '8px 16px'
                }}
              >
                {adding ? 'Adding...' : 'Share'}
              </button>
            </div>
          </form>

          {/* Permissions list */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              People with access ({loading ? '...' : permissions.length})
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="loading-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
              </div>
            ) : permissions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--text-secondary)'
              }}>
                <p>No one else has access yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Add people above to share this file</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {permissions.map((perm) => {
                  const user = userCache[perm.userId] || {};
                  return (
                    <div
                      key={perm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: getRoleColor(perm.role),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}>
                          {getUserInitials(user)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || `User ${perm.userId}`
                            }
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px'
                          }}>
                            @{user.username || perm.userId} · {perm.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateRole(perm.id, perm.role)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            minWidth: '80px'
                          }}
                          title="Click to change role"
                        >
                          Change role
                        </button>
                        <button
                          onClick={() => handleRevokePermission(perm.id)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            color: 'var(--error-color)'
                          }}
                          title="Remove access"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
