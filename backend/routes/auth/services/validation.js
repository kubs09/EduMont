/* eslint-disable */

const validateLoginData = (email, password) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || !password.trim()) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateSignupData = (email, password, firstName, lastName) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || !password.trim()) {
    errors.push('Password is required');
  }

  if (!firstName || !firstName.trim()) {
    errors.push('First name is required');
  }

  if (!lastName || !lastName.trim()) {
    errors.push('Last name is required');
  }

  if (email && !/\S+@\S+\.\S+/.test(email)) {
    errors.push('Email format is invalid');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateForgotPasswordData = (email) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  }

  if (email && !/\S+@\S+\.\S+/.test(email)) {
    errors.push('Email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateLoginData,
  validateSignupData,
  validateForgotPasswordData,
};
