import { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { apiFetch } from '../utils/api';

const FileContext = createContext();

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

export const FileProvider = ({ children }) => {
  const [rawFiles, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentView, setCurrentView] = useState('my-drive');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Sorting options
  const [sortBy, setSortBy] = useState('name'); // name | createdAt | modifiedAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  const [foldersFirst, setFoldersFirst] = useState(true);

  const toggleSortOrder = () => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  const toggleFoldersFirst = () => setFoldersFirst((prev) => !prev);

  // Default: name A→Z
  const setSortByWithDefaultOrder = (nextSortBy) => {
    setSortBy(nextSortBy);
    if (nextSortBy === 'name') setSortOrder('asc');
    else setSortOrder('desc');
  };

  const files = useMemo(() => {
    const list = Array.isArray(rawFiles) ? [...rawFiles] : [];

    const normalizeName = (n) => String(n || '').toLocaleLowerCase();
    const getTime = (item, key) => {
      const v = item?.[key] || (key === 'modifiedAt' ? item?.createdAt : undefined) || '';
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : 0;
    };

    const keyCompare = (a, b) => {
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
      // Grouping folders first
      if (foldersFirst) {
        const af = !!a.isFolder;
        const bf = !!b.isFolder;
        if (af !== bf) return af ? -1 : 1;
      }

      // Secondary key (asc/desc)
      const c = keyCompare(a, b);
      return sortOrder === 'asc' ? c : -c;
    });

    return list;
  }, [rawFiles, sortBy, sortOrder, foldersFirst]);

  // Fetch files
  const fetchFiles = useCallback(async (parentId = null, options = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (parentId) params.append('parentId', parentId);
      if (options.folders !== undefined) params.append('folders', options.folders);
      if (options.files !== undefined) params.append('files', options.files);
      if (options.contents !== undefined) params.append('contents', options.contents);
      if (options.view !== undefined) {
        params.append('view', options.view);
        setCurrentView(options.view);
      }

      const response = await apiFetch(`/files?${params.toString()}`);
      if (!response) throw new Error('Failed to fetch files');

      const data = await response.json();
      setFiles(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new file or folder
  const createFile = async (fileData) => {
    try {
      const response = await apiFetch('/files', {
        method: 'POST',
        body: JSON.stringify(fileData)
      });

      if (!response) throw new Error('Failed to create file');

      await fetchFiles(currentFolder);

      if (response.status === 201) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  };

  // Get file by ID
  const getFile = async (fileId) => {
    try {
      const response = await apiFetch(`/files/${fileId}`);
      if (!response) throw new Error('Failed to get file');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get file:', error);
      throw error;
    }
  };

  // Update file
  const updateFile = async (fileId, updates) => {
    try {
      const response = await apiFetch(`/files/${fileId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (!response) throw new Error('Failed to update file');

      // Fetch the updated file list and the specific file details
      const [filesData, updatedFileResponse] = await Promise.all([
        fetchFiles(currentFolder),
        apiFetch(`/files/${fileId}`)
      ]);

      // Update selectedFile if it's the file being updated
      if (selectedFile && selectedFile.id === fileId && updatedFileResponse) {
        const updatedFile = await updatedFileResponse.json();
        setSelectedFile(updatedFile);
      }

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update file:', error);
      throw error;
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      const response = await apiFetch(`/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response) throw new Error('Failed to delete file');

      // Refetch with the current view context
      if (currentFolder) {
        await fetchFiles(currentFolder);
      } else {
        await fetchFiles(null, { view: currentView });
      }
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  };

  // Search files
  const searchFiles = async (query) => {
    try {
      const response = await apiFetch(`/search/${encodeURIComponent(query)}`);
      if (!response) throw new Error('Failed to search files');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to search files:', error);
      throw error;
    }
  };

  // Get file permissions
  const getPermissions = async (fileId) => {
    try {
      const response = await apiFetch(`/files/${fileId}/permissions`);
      if (!response) throw new Error('Failed to get permissions');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get permissions:', error);
      throw error;
    }
  };

  // Grant permission
  const grantPermission = async (fileId, userId, role) => {
    try {
      const response = await apiFetch(`/files/${fileId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ userId, role })
      });

      if (!response) throw new Error('Failed to grant permission');

      if (response.status === 201) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw error;
    }
  };

  // Update permission
  const updatePermission = async (fileId, permissionId, role) => {
    try {
      const response = await apiFetch(`/files/${fileId}/permissions/${permissionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });

      if (!response) throw new Error('Failed to update permission');

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update permission:', error);
      throw error;
    }
  };

  // Revoke permission
  const revokePermission = async (fileId, permissionId) => {
    try {
      const response = await apiFetch(`/files/${fileId}/permissions/${permissionId}`, {
        method: 'DELETE'
      });

      if (!response) throw new Error('Failed to revoke permission');
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw error;
    }
  };

  // Get user by ID
  const getUserById = async (userId) => {
    try {
      const response = await apiFetch(`/users/${userId}`);
      if (!response) throw new Error('Failed to get user');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  };

  // Star/unstar a file
  const toggleStar = async (fileId, isStarred) => {
    try {
      const response = await apiFetch(`/files/${fileId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isStarred })
      });

      if (!response) throw new Error('Failed to toggle star');

      // Update the file in the current files list
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === fileId ? { ...file, isStarred } : file
        )
      );

      // Update selectedFile if it's the one being starred
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile({ ...selectedFile, isStarred });
      }

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to toggle star:', error);
      throw error;
    }
  };

  const value = {
    files,
    currentFolder,
    setCurrentFolder,
    currentView,
    setCurrentView,
    loading,
    selectedFile,
    setSelectedFile,
    fetchFiles,
    createFile,
    getFile,
    updateFile,
    deleteFile,
    searchFiles,
    getPermissions,
    grantPermission,
    updatePermission,
    revokePermission,
    getUserById,
    toggleStar,
    setFiles,
    sortBy,
    sortOrder,
    foldersFirst,
    setSortBy: setSortByWithDefaultOrder,
    toggleSortOrder,
    toggleFoldersFirst,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
