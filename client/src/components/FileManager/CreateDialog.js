import React, { useState } from 'react';
import { useFiles } from '../../contexts/FileContext';

const CreateDialog = ({ type, onClose }) => {
  const { createFile, currentFolder } = useFiles();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setUploading(true);
    try {
      const fileData = {
        name: name.trim(),
        isFolder: type === 'folder',
        parentId: currentFolder
      };

      if (type === 'file') {
        fileData.data = content;
      }

      await createFile(fileData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ' + type);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setContent(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">
            {type === 'folder' ? 'New folder' : 'New file'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-content">
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'folder' ? 'Untitled folder' : 'Untitled.txt'}
                autoFocus
              />
            </div>

            {type === 'file' && (
              <>
                <div className="input-group">
                  <label htmlFor="file-upload">Upload from computer</label>
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="content">Content (optional)</label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter file content..."
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? <span className="loading-spinner"></span> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDialog;
