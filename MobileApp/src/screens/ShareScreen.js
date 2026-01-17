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
import { apiFetch } from '../utils/api';

const ShareScreen = ({ navigation, route }) => {
  const { file } = route.params;
  const { getPermissions, grantPermission, updatePermission, revokePermission } = useFiles();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('reader');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await getPermissions(file.id);

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

  const renderPermission = ({ item }) => (
    <View style={styles.permissionItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.user?.firstName?.[0] || item.user?.username?.[0] || '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.user?.firstName && item.user?.lastName
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.user?.username || 'Unknown'}
          </Text>
          <Text style={styles.userEmail}>{item.user?.username || ''}</Text>
        </View>
      </View>

      {item.role === 'owner' ? (
        <Text style={styles.ownerBadge}>Owner</Text>
      ) : (
        <View style={styles.roleActions}>
          <TouchableOpacity
            style={styles.roleSelector}
            onPress={() => {
              Alert.alert(
                'Change Role',
                `Select role for ${item.user?.username}`,
                [
                  { text: 'Reader', onPress: () => handleRoleChange(item.id || item._id, 'reader') },
                  { text: 'Writer', onPress: () => handleRoleChange(item.id || item._id, 'writer') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.roleText}>{item.role}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveUser(item.id || item._id, item.user?.username)}
          >
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share "{file.name}"</Text>
      </View>

      {/* Add User Section */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add people</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Enter username"
            placeholderTextColor="#9aa0a6"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.roleRow}>
          {roles.filter(r => r !== 'owner').map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleButtonText, selectedRole === role && styles.roleButtonTextActive]}>
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
        <Text style={styles.sectionTitle}>People with access</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
        ) : permissions.length === 0 ? (
          <Text style={styles.emptyText}>No one has access yet</Text>
        ) : (
          <FlatList
            data={permissions}
            renderItem={renderPermission}
            keyExtractor={(item) => item.id || item._id}
          />
        )}
      </View>
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
});

export default ShareScreen;