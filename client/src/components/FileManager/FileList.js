import React, { useMemo, useState } from 'react';
import { useFiles } from '../../contexts/FileContext';

const FileList = ({ view, onFileView, displayMode = 'grid' }) => {
  const { files, loading, selectedFile, setSelectedFile, setCurrentFolder, sortBy, sortOrder, foldersFirst, deleteFile, toggleStar, updateFile } = useFiles();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  const getFileIcon = (file) => {
    if (file.isFolder) {
      return (
        <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#5f6368"/>
        </svg>
      );
    }

    // Different icons based on the file type
    const name = file.name?.toLowerCase() || '';
    if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.jpeg')) {
      return (
        <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#ea4335"/>
        </svg>
      );
    }

    if (name.endsWith('.txt')) {
      return (
        <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" fill="#5f6368"/>
        </svg>
      );
    }

    return (
      <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" fill="#5f6368"/>
      </svg>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays < 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleFileDoubleClick = (file) => {
    if (file.isFolder) {
      setCurrentFolder(file.id);
    } else if (onFileView) {
      onFileView(file);
    }
  };

  const handleMenuClick = (e, fileId) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === fileId ? null : fileId);
  };

  const handleRename = async (file) => {
    setRenamingId(file.id);
    setNewName(file.name);
    setMenuOpenId(null);
  };

  const submitRename = async (fileId) => {
    if (newName.trim() && newName !== files.find(f => f.id === fileId)?.name) {
      await updateFile(fileId, { name: newName.trim() });
    }
    setRenamingId(null);
    setNewName('');
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteFile(fileId);
    }
    setMenuOpenId(null);
  };

  const handleToggleStar = async (file) => {
    await toggleStar(file.id, !file.isStarred);
    setMenuOpenId(null);
  };

  const sortedFiles = useMemo(() => {
      const list = Array.isArray(files) ? [...files] : [];
  
      const normalizeName = (n) => String(n || '').toLocaleLowerCase();
  
      const getTime = (item, key) => {
        const v = item?.[key] || (key === 'modifiedAt' ? item?.createdAt : undefined) || '';
        const t = Date.parse(v);
        return Number.isFinite(t) ? t : 0;
      };
  
      const compareCore = (a, b) => {
        // grouping folders first
        if (foldersFirst) {
          const af = !!a.isFolder;
          const bf = !!b.isFolder;
          if (af !== bf) return af ? -1 : 1;
        }
  
        if (sortBy === 'name') {
          return normalizeName(a.name).localeCompare(normalizeName(b.name));
        }
  
        if (sortBy === 'createdAt') {
          return getTime(a, 'createdAt') - getTime(b, 'createdAt');
        }
  
        if (sortBy === 'modifiedAt') {
          return getTime(a, 'modifiedAt') - getTime(b, 'modifiedAt');
        }
  
        return 0;
      };
  
      list.sort((a, b) => {
        const c = compareCore(a, b);
        return sortOrder === 'asc' ? c : -c;
      });
  
      return list;
    }, [files, sortBy, sortOrder, foldersFirst]);

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="file-list-empty">
          <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  // Ensure files is always an array
  const fileArray = Array.isArray(files) ? files : [];

  if (fileArray.length === 0) {
    return (
      <div className="file-list-container">
        <div className="file-list-empty">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" fill="currentColor"/>
          </svg>
          <h3>No files yet</h3>
          <p>Create a new file or folder to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      {menuOpenId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setMenuOpenId(null)}
        />
      )}
      <div className={displayMode === 'grid' ? 'file-grid' : 'file-list'}>
        {sortedFiles.map((file) => (
          <div
            key={file.id}
            className={`file-item ${displayMode === 'list' ? 'file-item-list' : ''} ${selectedFile?.id === file.id ? 'selected' : ''}`}
            onClick={() => handleFileClick(file)}
            onDoubleClick={() => handleFileDoubleClick(file)}
          >
            {getFileIcon(file)}

            {renamingId === file.id ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitRename(file.id)}
                onBlur={() => submitRename(file.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: '14px',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            ) : (
              <div className="file-name" title={file.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
                minWidth: 0
              }}>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {file.name}
                </span>
                {file.isStarred && (
                  <svg
                    className="file-star-badge"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    style={{ fill: '#fbbf24', flexShrink: 0 }}
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                )}
              </div>
            )}

            <button
              className="file-menu-button"
              onClick={(e) => handleMenuClick(e, file.id)}
              style={{
                position: displayMode === 'list' ? 'relative' : 'absolute',
                top: displayMode === 'list' ? 'auto' : '8px',
                right: displayMode === 'list' ? 'auto' : '8px',
                marginLeft: displayMode === 'list' ? 'auto' : '0',
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s, background-color 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                if (menuOpenId !== file.id) {
                  e.currentTarget.style.opacity = '0';
                }
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>

            {menuOpenId === file.id && (
              <div
                style={{
                  position: 'absolute',
                  top: displayMode === 'list' ? '50%' : '40px',
                  right: '8px',
                  transform: displayMode === 'list' ? 'translateY(-50%)' : 'none',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  minWidth: '160px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleRename(file)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Rename
                </button>

                <button
                  onClick={() => handleToggleStar(file)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    {file.isStarred ? (
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fbbf24"/>
                    ) : (
                      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
                    )}
                  </svg>
                  {file.isStarred ? 'Unstar' : 'Star'}
                </button>

                <button
                  onClick={() => handleDelete(file.id)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: 'var(--error-color)',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
