export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateUsername = (username) => {
  return username.length >= 3;
};

export const validateName = (name) => {
  return name.trim().length > 0;
};

export const validatePhoneNumber = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone.replace(/[-\s]/g, ''));
};

export const validateDate = (date) => {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  return selectedDate < today;
};

export const validateLoginForm = (username, password) => {
  const errors = {};

  if (!username.trim()) {
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
    errors.password = 'Password must be at least 8 characters';
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
