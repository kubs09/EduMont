/* eslint-disable */
const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Phone is optional
  return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone);
};

const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password) return false;
  return password.length >= 6;
};

const validateUserProfile = ({ firstname, surname, email, phone }) => {
  const errors = [];

  if (!firstname || firstname.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!surname || surname.trim().length === 0) {
    errors.push('Surname is required');
  }

  if (!validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!validatePhoneNumber(phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateUserProfile,
};
