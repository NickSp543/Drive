import React, { useState } from 'react';
import { useFiles } from '../../contexts/FileContext';

const FileToolbar = ({ view, onCreateFile, onCreateFolder, displayMode, onDisplayModeChange }) => {
  const {
    searchFiles,
    setFiles,
    sortBy,
    sortOrder,
    foldersFirst,
    setSortBy,
    toggleSortOrder,
    toggleFoldersFirst,
  } = useFiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const getViewTitle = () => {
    switch (view) {
      case 'my-drive':
        return 'My Drive';
      case 'shared':
        return 'Shared with me';
      case 'recent':
        return 'Recent';
      case 'starred':
        return 'Starred';
      case 'trash':
        return 'Trash';
      default:
        return 'My Drive';
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchFiles(searchQuery);
      setFiles(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="file-toolbar">
      <h2 className="toolbar-title">{getViewTitle()}</h2>

      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '600px', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search in Drive"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '24px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={sortBy}
          onChange={(e) => {
            if (e.target.value === 'toggle-folders') {
              toggleFoldersFirst();
              e.target.value = sortBy; // Reset to current sortBy
            } else {
              setSortBy(e.target.value);
            }
          }}
          title="Sort"
          style={{
            height: '36px',
            borderRadius: '18px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '0 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="name">Name</option>
          <option value="createdAt">Date created</option>
          <option value="modifiedAt">Date modified</option>
          <option disabled>────────</option>
          <option value="toggle-folders">
            {foldersFirst ? '✓ Folders first' : '○ Folders first'}
          </option>
        </select>

        <button
          type="button"
          className="toolbar-button"
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            {sortOrder === 'asc' ? (
              <path d="M7 14l5-5 5 5H7z"/>
            ) : (
              <path d="M7 10l5 5 5-5H7z"/>
            )}
          </svg>
        </button>
      </div>

      <div className="toolbar-actions">
        <button className="toolbar-button" onClick={onCreateFile} title="Upload file">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>
        </button>

        <button className="toolbar-button" onClick={onCreateFolder} title="New folder">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/>
          </svg>
        </button>

        <button
          className="toolbar-button"
          title="List view"
          onClick={() => onDisplayModeChange('list')}
          style={{
            backgroundColor: displayMode === 'list' ? 'var(--bg-secondary)' : 'transparent'
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        </button>

        <button
          className="toolbar-button"
          title="Grid view"
          onClick={() => onDisplayModeChange('grid')}
          style={{
            backgroundColor: displayMode === 'grid' ? 'var(--bg-secondary)' : 'transparent'
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FileToolbar;
