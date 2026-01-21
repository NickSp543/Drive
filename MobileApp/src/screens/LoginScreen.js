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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { validateLoginForm } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { theme, darkMode, toggleDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
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

  const handleLogin = async () => {
    setServerError('');

    const validation = validateLoginForm(formData.username, formData.password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    const result = await login(formData.username, formData.password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Home');
    } else {
      setServerError(result.error);
    }
  };

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

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Sign in</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>to continue to Drive</Text>
          </View>

          {/* Server Error */}
          {serverError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.username && styles.inputError]}
              placeholder="Enter your username"
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholder}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>Create account</Text>
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
    justifyContent: 'center',
    padding: 24,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#c5221f',
  },
  fieldError: {
    color: '#c5221f',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 52,
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
    marginTop: 24,
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

export default LoginScreen;