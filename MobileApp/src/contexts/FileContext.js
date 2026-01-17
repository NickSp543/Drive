import React, { createContext, useState, useContext, useCallback } from 'react';
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
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentView, setCurrentView] = useState('my-drive');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
      }

      const response = await apiFetch(`/files?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch files');

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

  // Create file or folder
  const createFile = async (fileData) => {
    try {
      const response = await apiFetch('/files', {
        method: 'POST',
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create file');
      }

      await fetchFiles(currentFolder, { view: currentView });
      return { success: true };
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  };

  // Get file by ID
  const getFile = async (fileId) => {
    try {
      const response = await apiFetch(`/files/${fileId}`);
      if (!response.ok) throw new Error('Failed to get file');
      return await response.json();
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

      if (!response.ok) throw new Error('Failed to update file');

      await fetchFiles(currentFolder, { view: currentView });

      if (selectedFile && selectedFile.id === fileId) {
        const updatedFileResponse = await apiFetch(`/files/${fileId}`);
        if (updatedFileResponse.ok) {
          const updatedFile = await updatedFileResponse.json();
          setSelectedFile(updatedFile);
        }
      }

      return { success: true };
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

      if (!response.ok) throw new Error('Failed to delete file');

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
      if (!response.ok) throw new Error('Failed to search files');
      return await response.json();
    } catch (error) {
      console.error('Failed to search files:', error);
      throw error;
    }
  };

  // Get permissions
  const getPermissions = async (fileId) => {
    try {
      const response = await apiFetch(`/files/${fileId}/permissions`);
      if (!response.ok) throw new Error('Failed to get permissions');
      return await response.json();
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

      if (!response.ok) throw new Error('Failed to grant permission');
      return { success: true };
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

      if (!response.ok) throw new Error('Failed to update permission');
      return { success: true };
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

      if (!response.ok) throw new Error('Failed to revoke permission');
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw error;
    }
  };

  // Toggle star
  const toggleStar = async (fileId, isStarred) => {
    try {
      const response = await apiFetch(`/files/${fileId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isStarred })
      });

      if (!response.ok) throw new Error('Failed to toggle star');

      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === fileId ? { ...file, isStarred } : file
        )
      );

      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile({ ...selectedFile, isStarred });
      }

      return { success: true };
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
    toggleStar,
    setFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
