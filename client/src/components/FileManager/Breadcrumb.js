import React, { useState, useEffect } from 'react';
import { useFiles } from '../../contexts/FileContext';

const Breadcrumb = () => {
  const { currentFolder, setCurrentFolder, getFile } = useFiles();
  const [path, setPath] = useState([{ id: null, name: 'My Drive' }]);

  const buildPath = async () => {
    if (!currentFolder) {
      setPath([{ id: null, name: 'My Drive' }]);
      return;
    }

    const pathItems = [];
    let current = currentFolder;

    // Build path by traversing t parent folders
    const visited = new Set();
    while (current && !visited.has(current)) {
      visited.add(current);
      try {
        const folder = await getFile(current);
        pathItems.push({ id: folder.id, name: folder.name });
        current = folder.parentId;
      } catch (error) {
        console.error('Failed to build path:', error);
        break;
      }
    }

    pathItems.reverse();

    setPath([{ id: null, name: 'My Drive' }, ...pathItems]);
  };

  useEffect(() => {
    buildPath();
  }, [currentFolder]);

  return (
    <div className="breadcrumb">
      {path.map((item, index) => (
        <React.Fragment key={item.id || 'root'}>
          <button
            className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
            onClick={() => setCurrentFolder(item.id)}
          >
            {item.name}
          </button>
          {index < path.length - 1 && (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="breadcrumb-separator">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
