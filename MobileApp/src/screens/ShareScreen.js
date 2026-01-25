import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFiles } from '../contexts/FileContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../utils/api';

const ShareScreen = ({ navigation, route }) => {
  const { file } = route.params;
  const { getPermissions, grantPermission, updatePermission, revokePermission } = useFiles();
  const { theme, darkMode, toggleDarkMode } = useTheme();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('reader');
  const [adding, setAdding] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await getPermissions(file.id || file._id);

      // Check if response indicates user is not owner
      if (perms && perms.notOwner) {
        setIsOwner(false);
        setMyRole(perms.myRole);
        setPermissions([]);
        return;
      }

      setIsOwner(true);

      // Load user details for each permission
      const permsWithUsers = await Promise.all(
        perms.map(async (perm) => {
          try {
            const response = await apiFetch(`/users/${perm.userId}`);
            if (response.ok) {
              const user = await response.json();
              return { ...perm, user };
            }
          } catch (e) {
            console.error('Failed to load user:', e);
          }
          return perm;
        })
      );

      setPermissions(permsWithUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setAdding(true);
    try {
      // First find the user by username
      const userResponse = await apiFetch(`/users/by-username/${username.trim()}`);
      if (!userResponse.ok) {
        Alert.alert('Error', 'User not found');
        setAdding(false);
        return;
      }

      const user = await userResponse.json();

      // Check if user already has permission
      const existingPerm = permissions.find(p => p.userId === user.id);
      if (existingPerm) {
        Alert.alert('Error', 'User already has access to this file');
        setAdding(false);
        return;
      }

      // Grant permission
      await grantPermission(file.id, user.id, selectedRole);

      setUsername('');
      Alert.alert('Success', `${user.username} now has ${selectedRole} access`);
      await loadPermissions();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (permId, newRole) => {
    try {
      await updatePermission(file.id, permId, newRole);
      await loadPermissions();
    } catch (error) {
      Alert.alert('Error', 'Failed to update permission');
    }
  };

  const handleRemoveUser = async (permId, userName) => {
    Alert.alert(
      'Remove Access',
      `Remove ${userName}'s access to this file?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokePermission(file.id, permId);
              await loadPermissions();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove access');
            }
          }
        }
      ]
    );
  };

  const roles = ['reader', 'writer', 'owner'];

  const renderPermission = ({ item }) => {
    // Get display name from either user object or direct username field
    const displayName = item.user?.firstName && item.user?.lastName
      ? `${item.user.firstName} ${item.user.lastName}`
      : item.user?.username || item.username || 'Unknown';
    const displayUsername = item.user?.username || item.username || '';
    const avatarLetter = item.user?.firstName?.[0] || item.user?.username?.[0] || item.username?.[0] || '?';

    return (
      <View style={[styles.permissionItem, { borderBottomColor: theme.itemBorder }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, item.inherited && styles.avatarInherited]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {displayUsername}
              {item.inherited ? ' (inherited from folder)' : ''}
            </Text>
          </View>
        </View>

        {item.role === 'owner' ? (
          <Text style={[styles.ownerBadge, { color: theme.textSecondary }]}>Owner</Text>
        ) : item.inherited ? (
          <Text style={[styles.inheritedBadge, { color: theme.textSecondary }]}>{item.role}</Text>
        ) : (
          <View style={styles.roleActions}>
            <TouchableOpacity
              style={[styles.roleSelector, { borderColor: theme.inputBorder }]}
              onPress={() => {
                Alert.alert(
                  'Change Role',
                  `Select role for ${displayUsername}`,
                  [
                    { text: 'Reader', onPress: () => handleRoleChange(item.id || item._id, 'reader') },
                    { text: 'Writer', onPress: () => handleRoleChange(item.id || item._id, 'writer') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={[styles.roleText, { color: theme.text }]}>{item.role}</Text>
              <Text style={[styles.dropdownIcon, { color: theme.textSecondary }]}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveUser(item.id || item._id, displayUsername)}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: theme.textSecondary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Share "{file.name}"</Text>
        {/* Dark mode toggle */}
        <TouchableOpacity onPress={toggleDarkMode} style={styles.darkModeButton}>
          <Text style={styles.darkModeIcon}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : !isOwner ? (
        /* Show message for non-owners */
        <View style={styles.notOwnerContainer}>
          <Text style={styles.notOwnerIcon}>🔒</Text>
          <Text style={[styles.notOwnerTitle, { color: theme.text }]}>You cannot share this file</Text>
          <Text style={[styles.notOwnerMessage, { color: theme.textSecondary }]}>
            You are a {myRole}. Only the owner can manage sharing permissions.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Add User Section */}
          <View style={[styles.addSection, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add people</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.usernameInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                placeholder="Enter username"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.roleRow}>
              {roles.filter(r => r !== 'owner').map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    { borderColor: theme.inputBorder },
                    selectedRole === role && { backgroundColor: theme.roleButtonActiveBg, borderColor: theme.roleButtonActiveBorder }
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[
                    styles.roleButtonText,
                    { color: theme.textSecondary },
                    selectedRole === role && { color: theme.roleButtonActiveText, fontWeight: '500' }
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={handleAddUser}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Current Permissions */}
          <View style={styles.permissionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>People with access</Text>
            {permissions.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No one has access yet</Text>
            ) : (
              <FlatList
                data={permissions}
                renderItem={renderPermission}
                keyExtractor={(item) => item.id || item._id}
              />
            )}
          </View>
        </>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#5f6368',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202124',
    flex: 1,
  },
  darkModeButton: {
    padding: 8,
  },
  darkModeIcon: {
    fontSize: 20,
  },
  addSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  usernameInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#5f6368',
  },
  roleButtonTextActive: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#1a73e8',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#a8c7fa',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  permissionsSection: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#5f6368',
    fontSize: 14,
    marginTop: 40,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#202124',
  },
  userEmail: {
    fontSize: 12,
    color: '#5f6368',
  },
  ownerBadge: {
    fontSize: 14,
    color: '#5f6368',
    fontStyle: 'italic',
  },
  inheritedBadge: {
    fontSize: 14,
    color: '#5f6368',
    fontStyle: 'italic',
  },
  avatarInherited: {
    backgroundColor: '#9aa0a6',
  },
  roleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    marginRight: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#202124',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#5f6368',
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 16,
    color: '#c5221f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notOwnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notOwnerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  notOwnerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  notOwnerMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ShareScreen;