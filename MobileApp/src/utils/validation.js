// Validation utilities - as it is from web client

export const validateUsername = (username) => {
  return username && username.length >= 3;
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  // Must contain at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

export const validateName = (name) => {
  return name && name.trim().length > 0;
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const re = /^\d{10}$/;
  return re.test(phone.replace(/[-\s]/g, ''));
};

export const validateDate = (date) => {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  return selectedDate < today && !isNaN(selectedDate.getTime());
};

export const validateLoginForm = (username, password) => {
  const errors = {};

  if (!username || !username.trim()) {
    errors.username = 'Username is required';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegistrationForm = (formData) => {
  const errors = {};

  if (!validateUsername(formData.username)) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters with letters and numbers';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!validateName(formData.firstName)) {
    errors.firstName = 'First name is required';
  }

  if (!validateName(formData.lastName)) {
    errors.lastName = 'Last name is required';
  }

  if (!validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Phone number must be 10 digits';
  }

  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }

  if (!validateDate(formData.birthDate)) {
    errors.birthDate = 'Valid birth date is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
