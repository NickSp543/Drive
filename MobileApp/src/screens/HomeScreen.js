import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const {
    files,
    loading,
    currentFolder,
    setCurrentFolder,
    currentView,
    setCurrentView,
    fetchFiles,
    createFile,
    updateFile,
    deleteFile,
    toggleStar,
    searchFiles,
  } = useFiles();

  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [newItemName, setNewItemName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [availableFolders, setAvailableFolders] = useState([]);

  // Drag mode state - item selected for moving
  const [dragItem, setDragItem] = useState(null);

  // Display options
  const [darkMode, setDarkMode] = useState(false);
  const [blockView, setBlockView] = useState(false); // false = list, true = blocks

  // Load files on mount only
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      await fetchFiles(currentFolder, { view: currentView });
    } catch (error) {
      Alert.alert('Error', 'Failed to load files');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }, [currentFolder, currentView]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const navigateToView = async (view) => {
    setDrawerVisible(false);
    setCurrentFolder(null);
    setFolderStack([]);
    setSearchResults(null);
    setSearchQuery('');
    setDragItem(null);
    setCurrentView(view);
    try {
      await fetchFiles(null, { view });
    } catch (error) {
      Alert.alert('Error', 'Failed to load files');
    }
  };

  const handleFolderPress = async (folder) => {
    setFolderStack(prev => [...prev, { id: currentFolder, name: folder.name }]);
    setCurrentFolder(folder.id || folder._id);
    try {
      await fetchFiles(folder.id || folder._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to open folder');
    }
  };

  const handleBackPress = async () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      newStack.pop();
      setFolderStack(newStack);
      const parentId = newStack.length > 0 ? newStack[newStack.length - 1].id : null;
      setCurrentFolder(parentId);
      try {
        await fetchFiles(parentId, { view: currentView });
      } catch (error) {
        Alert.alert('Error', 'Failed to go back');
      }
    }
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      await createFile({
        name: newItemName.trim(),
        isFolder: createType === 'folder',
        data: createType === 'file' ? newFileContent : null,
        parentId: currentFolder,
      });
      setCreateModalVisible(false);
      setNewItemName('');
      setNewFileContent('');
      Alert.alert('Success', `${createType === 'folder' ? 'Folder' : 'File'} created successfully`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create item');
    }
  };

  const handleUploadFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Read file content if it's a text file
      let fileContent = null;
      if (file.mimeType && file.mimeType.startsWith('text/')) {
        try {
          const response = await fetch(file.uri);
          fileContent = await response.text();
        } catch (e) {
          console.log('Could not read file content:', e);
        }
      }

      await createFile({
        name: file.name,
        isFolder: false,
        data: fileContent,
        mimeType: file.mimeType,
        size: file.size,
        parentId: currentFolder,
      });

      setCreateModalVisible(false);
      Alert.alert('Success', `File "${file.name}" uploaded successfully`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload file');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await searchFiles(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    }
  };

  const handleItemLongPress = (item) => {
    setSelectedItem(item);
    setActionModalVisible(true);
  };

  const handleDelete = async () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete',
      `Are you sure you want to ${currentView === 'trash' ? 'permanently delete' : 'move to trash'} "${selectedItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFile(selectedItem.id || selectedItem._id);
              Alert.alert('Success', 'Item deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const handleRename = () => {
    setActionModalVisible(false);
    setRenameValue(selectedItem.name);
    setRenameModalVisible(true);
  };

  const submitRename = async () => {
    if (!renameValue.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      await updateFile(selectedItem.id || selectedItem._id, { name: renameValue.trim() });
      setRenameModalVisible(false);
      Alert.alert('Success', 'Item renamed');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename item');
    }
  };

  const handleToggleStar = async () => {
    setActionModalVisible(false);
    try {
      await toggleStar(selectedItem.id || selectedItem._id, !selectedItem.isStarred);
    } catch (error) {
      Alert.alert('Error', 'Failed to update star');
    }
  };

  const handleRestore = async () => {
    setActionModalVisible(false);
    try {
      await updateFile(selectedItem.id || selectedItem._id, { isTrashed: false });
      Alert.alert('Success', 'Item restored');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore item');
    }
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    setEditContent(selectedItem.data || '');
    setEditModalVisible(true);
  };

  const submitEdit = async () => {
    try {
      await updateFile(selectedItem.id || selectedItem._id, { data: editContent });
      setEditModalVisible(false);
      Alert.alert('Success', 'File saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save file');
    }
  };

  const handleShare = () => {
    setActionModalVisible(false);
    navigation.navigate('Share', { file: selectedItem });
  };

  const handleMove = async () => {
    setActionModalVisible(false);
    try {
      const allFiles = await fetchFiles(null, { view: 'my-drive', folders: 'true' });
      const folders = (allFiles || files).filter(
        f => f.isFolder && (f.id || f._id) !== (selectedItem?.id || selectedItem?._id)
      );
      setAvailableFolders(folders);
      setMoveModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load folders');
    }
  };

  const moveToFolder = async (targetFolderId) => {
    try {
      await updateFile(selectedItem.id || selectedItem._id, { parentId: targetFolderId });
      setMoveModalVisible(false);
      Alert.alert('Success', `Moved "${selectedItem.name}" to folder`);
      loadFiles();
    } catch (error) {
      Alert.alert('Error', 'Failed to move item');
    }
  };

  const moveToRoot = async () => {
    try {
      await updateFile(selectedItem.id || selectedItem._id, { parentId: null });
      setMoveModalVisible(false);
      Alert.alert('Success', `Moved "${selectedItem.name}" to My Drive`);
      loadFiles();
    } catch (error) {
      Alert.alert('Error', 'Failed to move item');
    }
  };

  // Start drag mode - select item to move
  const startDragMode = (item) => {
    setDragItem(item);
  };

  // Cancel drag mode
  const cancelDragMode = () => {
    setDragItem(null);
  };

  // Drop item into folder
  const dropIntoFolder = async (folder) => {
    if (!dragItem) return;

    const dragId = dragItem.id || dragItem._id;
    const folderId = folder.id || folder._id;

    // Can't drop into itself
    if (dragId === folderId) {
      Alert.alert('Error', 'Cannot move a folder into itself');
      return;
    }

    try {
      await updateFile(dragId, { parentId: folderId });
      Alert.alert('Success', `Moved "${dragItem.name}" to "${folder.name}"`);
      setDragItem(null);
      loadFiles();
    } catch (error) {
      Alert.alert('Error', 'Failed to move item');
    }
  };

  // Handle item press
  const handleItemPress = (item) => {
    const itemId = item.id || item._id;
    const dragId = dragItem?.id || dragItem?._id;

    // If in drag mode
    if (dragItem) {
      // Tapping a folder (that's not the dragged item) = drop into it
      if (item.isFolder && itemId !== dragId) {
        dropIntoFolder(item);
        return;
      }
      // Tapping anything else = cancel drag
      cancelDragMode();
      return;
    }

    // Normal behavior - tap folder to open, tap file to show menu
    if (item.isFolder) {
      handleFolderPress(item);
    } else {
      handleItemLongPress(item);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'my-drive': return 'My Drive';
      case 'starred': return 'Starred';
      case 'trash': return 'Trash';
      case 'recent': return 'Recent';
      case 'shared': return 'Shared with me';
      default: return 'My Drive';
    }
  };

  const displayFiles = searchResults !== null ? searchResults : files;

  // Theme colors
  const theme = {
    bg: darkMode ? '#1a1a1a' : '#fff',
    headerBg: darkMode ? '#252525' : '#fff',
    text: darkMode ? '#e8eaed' : '#202124',
    textSecondary: darkMode ? '#9aa0a6' : '#5f6368',
    border: darkMode ? '#3c4043' : '#e0e0e0',
    itemBg: darkMode ? '#252525' : '#fff',
    itemBorder: darkMode ? '#3c4043' : '#f1f3f4',
    searchBg: darkMode ? '#303134' : '#f1f3f4',
    drawerBg: darkMode ? '#252525' : '#fff',
    modalBg: darkMode ? '#303134' : '#fff',
    inputBg: darkMode ? '#3c4043' : '#fff',
    inputBorder: darkMode ? '#5f6368' : '#dadce0',
  };

  const renderItem = ({ item }) => {
    const itemId = item.id || item._id;
    const dragId = dragItem?.id || dragItem?._id;
    const isBeingDragged = dragItem && itemId === dragId;
    const isDropTarget = dragItem && item.isFolder && itemId !== dragId;

    // Block view rendering
    if (blockView) {
      return (
        <TouchableOpacity
          style={[
            styles.blockItem,
            { backgroundColor: theme.itemBg, borderColor: theme.itemBorder },
            isBeingDragged && styles.fileItemDragging,
            isDropTarget && styles.fileItemDropTarget,
          ]}
          onPress={() => handleItemPress(item)}
          onLongPress={() => startDragMode(item)}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <View style={styles.blockIconRow}>
            <Text style={styles.blockIcon}>
              {item.isFolder ? (isDropTarget ? '📂' : '📁') : '📄'}
            </Text>
            {!dragItem && (
              <TouchableOpacity
                style={styles.blockMenuButton}
                onPress={() => handleItemLongPress(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.menuDotsText, { color: theme.textSecondary }]}>⋮</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.blockName, { color: theme.text }, isBeingDragged && styles.fileNameDragging]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.blockDate, { color: theme.textSecondary }]}>
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
          </Text>
          {item.isStarred && <Text style={styles.blockStar}>⭐</Text>}
          {isBeingDragged && <Text style={styles.blockDragIndicator}>✋</Text>}
        </TouchableOpacity>
      );
    }

    // List view rendering
    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { backgroundColor: theme.itemBg, borderBottomColor: theme.itemBorder },
          isBeingDragged && styles.fileItemDragging,
          isDropTarget && styles.fileItemDropTarget,
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => startDragMode(item)}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={styles.fileIcon}>
          <Text style={styles.fileIconText}>
            {item.isFolder ? (isDropTarget ? '📂' : '📁') : '📄'}
          </Text>
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: theme.text }, isBeingDragged && styles.fileNameDragging]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.fileDate, { color: theme.textSecondary }]}>
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.isStarred && <Text style={styles.starIcon}>⭐</Text>}
        {isBeingDragged && <Text style={styles.dragIndicator}>✋</Text>}
        {/* 3-dots menu button */}
        {!dragItem && (
          <TouchableOpacity
            style={styles.menuDotsButton}
            onPress={() => handleItemLongPress(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.menuDotsText, { color: theme.textSecondary }]}>⋮</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
          <Text style={[styles.menuIcon, { color: theme.textSecondary }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {folderStack.length > 0 ? folderStack[folderStack.length - 1].name : getViewTitle()}
        </Text>
        {/* View toggle button */}
        <TouchableOpacity
          onPress={() => setBlockView(!blockView)}
          style={styles.headerIconButton}
        >
          <Text style={styles.headerIconText}>{blockView ? '☰' : '▦'}</Text>
        </TouchableOpacity>
        {/* Dark mode toggle button */}
        <TouchableOpacity
          onPress={() => setDarkMode(!darkMode)}
          style={styles.headerIconButton}
        >
          <Text style={styles.headerIconText}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {user?.firstName?.[0] || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.searchBg }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search in Drive"
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults(null); }}>
            <Text style={[styles.clearSearch, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Drag Mode Banner */}
      {dragItem && (
        <TouchableOpacity style={styles.dragBanner} onPress={cancelDragMode} activeOpacity={0.8}>
          <Text style={styles.dragBannerText}>
            ✋ Moving "{dragItem.name}" - Tap a folder to drop, or tap here to cancel
          </Text>
          <View style={styles.dragCancelButton}>
            <Text style={styles.dragCancelText}>✕</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Back Button */}
      {folderStack.length > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* File List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={displayFiles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item._id}
          numColumns={blockView ? 2 : 1}
          key={blockView ? 'blocks' : 'list'}
          columnWrapperStyle={blockView ? styles.blockRow : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchResults !== null ? 'No results found' : 'No files yet'}
              </Text>
            </View>
          }
          contentContainerStyle={displayFiles.length === 0 ? styles.emptyList : styles.listContent}
        />
      )}

      {/* FAB - Create Button */}
      {currentView === 'my-drive' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Drawer Modal */}
      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Drive</Text>
            </View>
            <TouchableOpacity
              style={[styles.drawerItem, currentView === 'my-drive' && styles.drawerItemActive]}
              onPress={() => navigateToView('my-drive')}
            >
              <Text style={styles.drawerItemIcon}>📁</Text>
              <Text style={styles.drawerItemText}>My Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, currentView === 'shared' && styles.drawerItemActive]}
              onPress={() => navigateToView('shared')}
            >
              <Text style={styles.drawerItemIcon}>👥</Text>
              <Text style={styles.drawerItemText}>Shared with me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, currentView === 'recent' && styles.drawerItemActive]}
              onPress={() => navigateToView('recent')}
            >
              <Text style={styles.drawerItemIcon}>🕐</Text>
              <Text style={styles.drawerItemText}>Recent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, currentView === 'starred' && styles.drawerItemActive]}
              onPress={() => navigateToView('starred')}
            >
              <Text style={styles.drawerItemIcon}>⭐</Text>
              <Text style={styles.drawerItemText}>Starred</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, currentView === 'trash' && styles.drawerItemActive]}
              onPress={() => navigateToView('trash')}
            >
              <Text style={styles.drawerItemIcon}>🗑️</Text>
              <Text style={styles.drawerItemText}>Trash</Text>
            </TouchableOpacity>
            <View style={styles.drawerDivider} />
            <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
              <Text style={styles.drawerItemIcon}>🚪</Text>
              <Text style={styles.drawerItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New</Text>
            <View style={styles.createTypeContainer}>
              <TouchableOpacity
                style={[styles.createTypeButton, createType === 'folder' && styles.createTypeActive]}
                onPress={() => setCreateType('folder')}
              >
                <Text style={styles.createTypeIcon}>📁</Text>
                <Text style={styles.createTypeText}>Folder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createTypeButton, createType === 'file' && styles.createTypeActive]}
                onPress={() => setCreateType('file')}
              >
                <Text style={styles.createTypeIcon}>📄</Text>
                <Text style={styles.createTypeText}>File</Text>
              </TouchableOpacity>
            </View>

            {/* Upload from Files Button */}
            <TouchableOpacity
              style={styles.uploadFromFilesButton}
              onPress={handleUploadFromFiles}
            >
              <Text style={styles.uploadFromFilesIcon}>📱</Text>
              <Text style={styles.uploadFromFilesText}>Upload from Files</Text>
            </TouchableOpacity>

            <View style={styles.dividerWithText}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or create manually</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder={createType === 'folder' ? 'Folder name' : 'File name'}
              placeholderTextColor="#9aa0a6"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            {createType === 'file' && (
              <TextInput
                style={[styles.modalInput, styles.contentInput]}
                placeholder="File content (optional)"
                placeholderTextColor="#9aa0a6"
                value={newFileContent}
                onChangeText={setNewFileContent}
                multiline
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewItemName('');
                  setNewFileContent('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateButton} onPress={handleCreate}>
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>{selectedItem?.name}</Text>
            {!selectedItem?.isFolder && (
              <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
                <Text style={styles.actionItemIcon}>✏️</Text>
                <Text style={styles.actionItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionItem} onPress={handleRename}>
              <Text style={styles.actionItemIcon}>📝</Text>
              <Text style={styles.actionItemText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleToggleStar}>
              <Text style={styles.actionItemIcon}>{selectedItem?.isStarred ? '⭐' : '☆'}</Text>
              <Text style={styles.actionItemText}>
                {selectedItem?.isStarred ? 'Remove star' : 'Add star'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <Text style={styles.actionItemIcon}>👥</Text>
              <Text style={styles.actionItemText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleMove}>
              <Text style={styles.actionItemIcon}>📂</Text>
              <Text style={styles.actionItemText}>Move to folder</Text>
            </TouchableOpacity>
            {currentView === 'trash' && (
              <TouchableOpacity style={styles.actionItem} onPress={handleRestore}>
                <Text style={styles.actionItemIcon}>♻️</Text>
                <Text style={styles.actionItemText}>Restore</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionItem, styles.deleteAction]} onPress={handleDelete}>
              <Text style={styles.actionItemIcon}>🗑️</Text>
              <Text style={[styles.actionItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New name"
              placeholderTextColor="#9aa0a6"
              value={renameValue}
              onChangeText={setRenameValue}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateButton} onPress={submitRename}>
                <Text style={styles.modalCreateText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModalContent]}>
            <Text style={styles.modalTitle}>Edit File</Text>
            <TextInput
              style={[styles.modalInput, styles.editInput]}
              placeholder="File content"
              placeholderTextColor="#9aa0a6"
              value={editContent}
              onChangeText={setEditContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateButton} onPress={submitEdit}>
                <Text style={styles.modalCreateText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move Modal */}
      <Modal
        visible={moveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.moveModalContent]}>
            <Text style={styles.modalTitle}>Move "{selectedItem?.name}"</Text>
            <Text style={styles.moveSubtitle}>Select destination folder:</Text>

            {/* Move to Root option */}
            {currentFolder && (
              <TouchableOpacity style={styles.folderOption} onPress={moveToRoot}>
                <Text style={styles.folderOptionIcon}>🏠</Text>
                <Text style={styles.folderOptionText}>My Drive (root)</Text>
              </TouchableOpacity>
            )}

            {/* Folder list */}
            {availableFolders.length > 0 ? (
              <FlatList
                data={availableFolders}
                keyExtractor={(item) => item.id || item._id}
                style={styles.folderList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.folderOption}
                    onPress={() => moveToFolder(item.id || item._id)}
                  >
                    <Text style={styles.folderOptionIcon}>📁</Text>
                    <Text style={styles.folderOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noFoldersContainer}>
                <Text style={styles.noFoldersText}>No folders available</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.moveCancelButton}
              onPress={() => setMoveModalVisible(false)}
            >
              <Text style={styles.moveCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#5f6368',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#202124',
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    padding: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f1f3f4',
    borderRadius: 24,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
  },
  clearSearch: {
    fontSize: 18,
    color: '#5f6368',
    padding: 4,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a73e8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    backgroundColor: '#fff',
  },
  fileIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconText: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    color: '#202124',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#5f6368',
  },
  starIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#5f6368',
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '75%',
    backgroundColor: '#fff',
    paddingTop: 48,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  drawerItemActive: {
    backgroundColor: '#e8f0fe',
  },
  drawerItemIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#202124',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  editModalContent: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 20,
  },
  createTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  createTypeButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    width: '45%',
  },
  createTypeActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  createTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  createTypeText: {
    fontSize: 14,
    color: '#202124',
  },
  uploadFromFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadFromFilesIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  uploadFromFilesText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#9aa0a6',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202124',
    marginBottom: 16,
  },
  contentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  editInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#5f6368',
  },
  modalCreateButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCreateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionItemIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  actionItemText: {
    fontSize: 16,
    color: '#202124',
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 20,
  },
  deleteText: {
    color: '#c5221f',
  },
  moveModalContent: {
    maxHeight: '70%',
  },
  moveSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 16,
  },
  folderList: {
    maxHeight: 250,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  folderOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  folderOptionText: {
    fontSize: 16,
    color: '#202124',
    flex: 1,
  },
  noFoldersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noFoldersText: {
    fontSize: 14,
    color: '#5f6368',
  },
  moveCancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  moveCancelText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
  },
  // Drag mode styles
  dragBanner: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dragBannerText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  dragCancelButton: {
    padding: 8,
  },
  dragCancelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileItemDragging: {
    backgroundColor: '#e8f0fe',
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderRadius: 8,
  },
  fileItemDropTarget: {
    backgroundColor: '#c8e6c9',
    borderWidth: 2,
    borderColor: '#4caf50',
    borderRadius: 8,
  },
  fileNameDragging: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  dragIndicator: {
    fontSize: 20,
    marginLeft: 8,
  },
  menuDotsButton: {
    padding: 8,
    marginLeft: 4,
  },
  menuDotsText: {
    fontSize: 20,
    color: '#5f6368',
    fontWeight: 'bold',
  },
  // Header icon buttons
  headerIconButton: {
    padding: 8,
    marginRight: 4,
  },
  headerIconText: {
    fontSize: 20,
  },
  // Block view styles
  listContent: {
    paddingBottom: 80,
  },
  blockRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  blockItem: {
    width: '48%',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
  },
  blockIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockIcon: {
    fontSize: 32,
  },
  blockMenuButton: {
    padding: 4,
  },
  blockName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  blockDate: {
    fontSize: 11,
  },
  blockStar: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 14,
  },
  blockDragIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
});

export default HomeScreen;
