import { useEffect, useState } from 'react';
import { useFiles } from '../../contexts/FileContext';
import Sidebar from './Sidebar';
import FileList from './FileList';
import FileToolbar from './FileToolbar';
import CreateDialog from './CreateDialog';
import FileDetailsPanel from './FileDetailsPanel';
import FileViewer from './FileViewer';
import Breadcrumb from './Breadcrumb';
import './FileManager.css';

const FileManager = () => {
  const { fetchFiles, currentFolder, setCurrentFolder, selectedFile, currentView, setCurrentView } = useFiles();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState('folder');
  const [viewingFile, setViewingFile] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    // When navigating into folders, show all contents regardless of view
    if (currentFolder) {
      // Inside a folder - show all items in that folder

      if (currentView !== 'my-drive') {
        setCurrentView('my-drive');
      }
      fetchFiles(currentFolder, {}).catch(err => {
        console.error('Error fetching files:', err);
      });
    } else {
      // At root level - apply view filter
      fetchFiles(null, { view: currentView }).catch(err => {
        console.error('Error fetching files:', err);
      });
    }
  }, [currentFolder, currentView, fetchFiles, setCurrentView]);

  const handleCreate = (type) => {
    setCreateType(type);
    setShowCreateDialog(true);
  };

  const handleFileView = (file) => {
    if (!file.isFolder) {
      setViewingFile(file);
    }
  };

  return (
    <div className="file-manager">
      <Sidebar view={currentView} setView={setCurrentView} onCreateFolder={() => handleCreate('folder')} onCreateFile={() => handleCreate('file')} setCurrentFolder={setCurrentFolder} />

      <div className="file-manager-main">
        <FileToolbar
          view={currentView}
          onCreateFile={() => handleCreate('file')}
          onCreateFolder={() => handleCreate('folder')}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />

        <Breadcrumb />

        <FileList
          view={currentView}
          onFileView={handleFileView}
          displayMode={displayMode}
        />
      </div>

      {selectedFile && <FileDetailsPanel onFileView={handleFileView} />}

      {showCreateDialog && (
        <CreateDialog
          type={createType}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
};

export default FileManager;
