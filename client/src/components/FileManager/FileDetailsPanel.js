import React, { useState, useEffect } from 'react';
import { useFiles } from '../../contexts/FileContext';
import { useAuth } from '../../contexts/AuthContext';
import ShareDialog from './ShareDialog';

const FileDetailsPanel = ({ onFileView }) => {
  const { selectedFile, deleteFile, getPermissions, setSelectedFile, updateFile, getUserById, toggleStar } = useFiles();
  const { user: currentUser } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [permissionsWithUsers, setPermissionsWithUsers] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  const loadPermissions = async () => {
    if (!selectedFile) return;

    setLoadingPermissions(true);
    try {
      const perms = await getPermissions(selectedFile.id);
      setPermissions(perms);

      // Fetch user info for each permission
      const permsWithUserInfo = await Promise.all(
        perms.map(async (perm) => {
          try {
            const user = await getUserById(perm.userId);
            return {
              ...perm,
              username: user?.username || `User ${perm.userId}`
            };
          } catch (error) {
            console.error(`Failed to load user ${perm.userId}:`, error);
            return {
              ...perm,
              username: `User ${perm.userId}`
            };
          }
        })
      );
      setPermissionsWithUsers(permsWithUserInfo);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadOwner = async () => {
    if (!selectedFile || !selectedFile.ownerId) return;

    setLoadingOwner(true);
    try {
      const owner = await getUserById(selectedFile.ownerId);
      setOwnerInfo(owner);
    } catch (error) {
      console.error('Failed to load owner info:', error);
      setOwnerInfo(null);
    } finally {
      setLoadingOwner(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      loadPermissions();
      loadOwner();
    } else {
      setOwnerInfo(null);
      setPermissions([]);
      setPermissionsWithUsers([]);
    }
  }, [selectedFile]);

  // Check if current user can write (edit/rename/delete) this file
  const canWrite = () => {
    if (!currentUser || !selectedFile) return false;

    // Owner can always write
    if (selectedFile.ownerId === currentUser.id) return true;

    // Ensure permissionsWithUsers is an array before calling find
    if (!Array.isArray(permissionsWithUsers)) return false;

    // Check if user has writer permission
    const userPermission = permissionsWithUsers.find(
      perm => perm.userId === currentUser.id
    );

    return userPermission && (userPermission.role === 'writer' || userPermission.role === 'owner');
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await deleteFile(selectedFile.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete ' + (selectedFile.isFolder ? 'folder' : 'file'));
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === selectedFile.name) {
      setIsRenaming(false);
      return;
    }

    try {
      await updateFile(selectedFile.id, { name: newName.trim() });
      setIsRenaming(false);
    } catch (error) {
      console.error('Failed to rename:', error);
      alert('Failed to rename file');
    }
  };

  const startRename = () => {
    setNewName(selectedFile.name);
    setIsRenaming(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = () => {
    if (selectedFile.isFolder) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#5f6368"/>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" fill="#5f6368"/>
      </svg>
    );
  };

  if (!selectedFile) return null;

  return (
    <div className="file-details-panel">
      <div className="details-preview">
        {getFileIcon()}
        {isRenaming ? (
          <div style={{ width: '100%', padding: '8px 0' }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              onBlur={handleRename}
              autoFocus
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid var(--primary-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        ) : (
          <div className="details-name">{selectedFile.name}</div>
        )}
      </div>

      <div className="details-section">
        {!selectedFile.isFolder && onFileView && (
          <button className="details-button" onClick={() => onFileView(selectedFile)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            Open
          </button>
        )}

        <button
          className="details-button"
          onClick={() => toggleStar(selectedFile.id, !selectedFile.isStarred)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            {selectedFile.isStarred ? (
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fbbf24"/>
            ) : (
              <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
            )}
          </svg>
          {selectedFile.isStarred ? 'Unstar' : 'Star'}
        </button>

        {canWrite() && (
          <button className="details-button" onClick={startRename}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Rename
          </button>
        )}
      </div>

      <div className="details-section">
        <div className="details-section-title">Type</div>
        <div className="details-row">
          <span className="details-value">
            {selectedFile.isFolder ? 'Folder' : 'File'}
          </span>
        </div>
      </div>

      <div className="details-section">
        <div className="details-section-title">Details</div>

        <div className="details-row">
          <span className="details-label">Created</span>
          <span className="details-value">{formatDate(selectedFile.createdAt)}</span>
        </div>

        <div className="details-row">
          <span className="details-label">Modified</span>
          <span className="details-value">{formatDate(selectedFile.modifiedAt || selectedFile.createdAt)}</span>
        </div>

        {selectedFile.parentId && (
          <div className="details-row">
            <span className="details-label">Location</span>
            <span className="details-value">Folder ID: {selectedFile.parentId}</span>
          </div>
        )}

        <div className="details-row">
          <span className="details-label">Owner</span>
          <span className="details-value">
            {loadingOwner ? 'Loading...' : (
              currentUser && selectedFile.ownerId === currentUser.id
                ? 'Me'
                : (ownerInfo ? ownerInfo.username : `User ${selectedFile.ownerId}`)
            )}
          </span>
        </div>
      </div>

      <div className="details-section">
        <div className="details-section-title">
          Who has access ({loadingPermissions ? '...' : permissions.length})
        </div>
        {!loadingPermissions && permissionsWithUsers.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {permissionsWithUsers.map((perm) => (
              <div key={perm.id} style={{ padding: '4px 0' }}>
                {currentUser && perm.userId === currentUser.id ? 'Me' : perm.username} - {perm.role}
              </div>
            ))}
          </div>
        )}
        {currentUser && selectedFile.ownerId === currentUser.id && (
          <button
            className="details-button"
            style={{ marginTop: '12px' }}
            onClick={() => setShowShareDialog(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share
          </button>
        )}
      </div>

      <div className="details-section">
        {canWrite() && (
          <button
            className="details-button danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete {selectedFile.isFolder ? 'folder' : 'file'}
          </button>
        )}

        <button
          className="details-button"
          onClick={() => setSelectedFile(null)}
        >
          Close
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Delete {selectedFile.isFolder ? 'folder' : 'file'}?</h2>
            </div>
            <div className="dialog-content">
              <p>Are you sure you want to delete "{selectedFile.name}"?</p>
              {selectedFile.isFolder && (
                <p style={{ color: 'var(--error-color)', marginTop: '8px' }}>
                  This will also delete all files and folders inside it.
                </p>
              )}
            </div>
            <div className="dialog-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary"
                style={{ backgroundColor: 'var(--error-color)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareDialog && (
        <ShareDialog
          file={selectedFile}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
};

export default FileDetailsPanel;
