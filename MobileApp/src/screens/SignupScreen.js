import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { validateRegistrationForm } from '../utils/validation';

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { theme: baseTheme, darkMode, toggleDarkMode } = useTheme();

  // Extend theme with signup-specific colors
  const theme = {
    ...baseTheme,
    imagePlaceholderBg: darkMode ? '#3c4043' : '#e8eaed',
    imagePlaceholderBorder: darkMode ? '#5f6368' : '#dadce0',
  };

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    birthDate: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const selectImage = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    handleImageResponse(result);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    handleImageResponse(result);
  };

  const handleImageResponse = (result) => {
    if (result.canceled) {
      return;
    }
    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const base64Image = `data:${mimeType};base64,${asset.base64}`;
      setImagePreview(asset.uri);
      setFormData(prev => ({ ...prev, image: base64Image }));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async () => {
    setServerError('');

    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    setLoading(false);

    if (result.success) {
      navigation.replace('Home');
    } else {
      setServerError(result.error);
    }
  };

  const genderOptions = ['male', 'female', 'other'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.darkModeToggle}
            onPress={toggleDarkMode}
          >
            <Text style={styles.darkModeIcon}>{darkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join Drive today</Text>
          </View>

          {/* Server Error */}
          {serverError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Profile Image */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={selectImage} style={styles.imageButton}>
              {imagePreview ? (
                <Image source={{ uri: imagePreview }} style={styles.profileImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.imagePlaceholderBg, borderColor: theme.imagePlaceholderBorder }]}>
                  <Text style={[styles.imagePlaceholderText, { color: theme.textSecondary }]}>+</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.imageLabel, { color: theme.textSecondary }]}>Tap to add profile picture</Text>
            {errors.image ? (
              <Text style={styles.fieldError}>{errors.image}</Text>
            ) : null}
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Username *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.username && styles.inputError]}
              placeholder="At least 3 characters"
              placeholderTextColor={theme.placeholder}
              value={formData.username}
              onChangeText={(value) => handleChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username ? (
              <Text style={styles.fieldError}>{errors.username}</Text>
            ) : null}
          </View>

          {/* First Name & Last Name */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.label, { color: theme.text }]}>First Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.firstName && styles.inputError]}
                placeholder="First name"
                placeholderTextColor={theme.placeholder}
                value={formData.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
              />
              {errors.firstName ? (
                <Text style={styles.fieldError}>{errors.firstName}</Text>
              ) : null}
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.label, { color: theme.text }]}>Last Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.lastName && styles.inputError]}
                placeholder="Last name"
                placeholderTextColor={theme.placeholder}
                value={formData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
              />
              {errors.lastName ? (
                <Text style={styles.fieldError}>{errors.lastName}</Text>
              ) : null}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Password *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.password && styles.inputError]}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.placeholder}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Confirm Password *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.confirmPassword && styles.inputError]}
              placeholder="Re-enter password"
              placeholderTextColor={theme.placeholder}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              secureTextEntry
            />
            {errors.confirmPassword ? (
              <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.phoneNumber && styles.inputError]}
              placeholder="10 digits (e.g., 0501234567)"
              placeholderTextColor={theme.placeholder}
              value={formData.phoneNumber}
              onChangeText={(value) => handleChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />
            {errors.phoneNumber ? (
              <Text style={styles.fieldError}>{errors.phoneNumber}</Text>
            ) : null}
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Gender *</Text>
            <View style={styles.genderContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderButton,
                    { borderColor: theme.inputBorder },
                    formData.gender === option && styles.genderButtonSelected,
                    errors.gender && styles.genderButtonError,
                  ]}
                  onPress={() => handleChange('gender', option)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      { color: theme.textSecondary },
                      formData.gender === option && styles.genderButtonTextSelected,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender ? (
              <Text style={styles.fieldError}>{errors.gender}</Text>
            ) : null}
          </View>

          {/* Birth Date */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Birth Date *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.birthDate && styles.inputError]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.placeholder}
              value={formData.birthDate}
              onChangeText={(value) => handleChange('birthDate', value)}
            />
            {errors.birthDate ? (
              <Text style={styles.fieldError}>{errors.birthDate}</Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  darkModeToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  darkModeIcon: {
    fontSize: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6368',
  },
  errorContainer: {
    backgroundColor: '#fce8e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c5221f',
    fontSize: 14,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageButton: {
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dadce0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 36,
    color: '#5f6368',
  },
  imageLabel: {
    fontSize: 12,
    color: '#5f6368',
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#202124',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#c5221f',
  },
  fieldError: {
    color: '#c5221f',
    fontSize: 11,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderButtonSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  genderButtonError: {
    borderColor: '#c5221f',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#5f6368',
  },
  genderButtonTextSelected: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  button: {
    height: 48,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a8c7fa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#5f6368',
    fontSize: 14,
  },
  link: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignupScreen;