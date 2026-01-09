import React, { useState, useEffect, useRef } from 'react';
import { useFiles } from '../../contexts/FileContext';
import { useAuth } from '../../contexts/AuthContext';
import './FileViewer.css';

const FileViewer = ({ file, onClose }) => {
  const { updateFile, getFile, getPermissions } = useFiles();
  const { user: currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const textareaRef = useRef(null);

  const loadFileContent = async () => {
    setLoading(true);
    try {
      const fileData = await getFile(file.id);
      setContent(fileData.data || '');
    } catch (error) {
      console.error('Failed to load file content:', error);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const perms = await getPermissions(file.id);
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  useEffect(() => {
    loadFileContent();
    loadPermissions();
  }, [file.id]);

  // Check if current user can write (edit) this file
  const canWrite = () => {
    if (!currentUser || !file) return false;

    // Owner can always write
    if (file.ownerId === currentUser.id) return true;

    // Ensure permissions is an array before calling find
    if (!Array.isArray(permissions)) return false;

    // Check if user has writer permission
    const userPermission = permissions.find(
      perm => perm.userId === currentUser.id
    );

    return userPermission && (userPermission.role === 'writer' || userPermission.role === 'owner');
  };

  // Use useRef to focus on textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFile(file.id, { data: content });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const isImage = () => {
    const name = file.name?.toLowerCase() || '';
    return name.endsWith('.jpg') || name.endsWith('.jpeg') ||
           name.endsWith('.png') || name.endsWith('.gif') ||
           name.endsWith('.bmp') || name.endsWith('.webp');
  };

  const isText = () => {
    const name = file.name?.toLowerCase() || '';
    return name.endsWith('.txt') || name.endsWith('.md') ||
           name.endsWith('.json') || name.endsWith('.js') ||
           name.endsWith('.css') || name.endsWith('.html') ||
           name.endsWith('.xml') || !name.includes('.');
  };

  return (
    <div className="file-viewer-overlay" onClick={onClose}>
      <div className="file-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="file-viewer-header">
          <div className="file-viewer-title">
            <h2>{file.name}</h2>
            <span className="file-viewer-type">
              {file.isFolder ? 'Folder' : isImage() ? 'Image' : isText() ? 'Text' : 'File'}
            </span>
          </div>
          <div className="file-viewer-actions">
            {isText() && !isEditing && canWrite() && (
              <button onClick={() => setIsEditing(true)} className="btn-secondary">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Edit
              </button>
            )}
            {isEditing && (
              <>
                <button onClick={handleSave} className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  loadFileContent();
                }} className="btn-secondary">
                  Cancel
                </button>
              </>
            )}
            <button onClick={onClose} className="btn-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="file-viewer-content">
          {loading ? (
            <div className="file-viewer-loading">
              <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
              <p>Loading file...</p>
            </div>
          ) : file.isFolder ? (
            <div className="file-viewer-empty">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <p>This is a folder</p>
              <p className="file-viewer-hint">Double-click to open it</p>
            </div>
          ) : isImage() ? (
            <div className="file-viewer-image">
              {content ? (
                <img src={content} alt={file.name} />
              ) : (
                <div className="file-viewer-empty">
                  <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p>No image data</p>
                </div>
              )}
            </div>
          ) : isText() ? (
            <div className="file-viewer-text">
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="file-viewer-editor"
                  placeholder="Enter file content..."
                />
              ) : (
                <pre className="file-viewer-preview">{content || 'Empty file'}</pre>
              )}
            </div>
          ) : (
            <div className="file-viewer-empty">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
              </svg>
              <p>Cannot preview this file type</p>
              <p className="file-viewer-hint">File type: {file.name?.split('.').pop() || 'unknown'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
