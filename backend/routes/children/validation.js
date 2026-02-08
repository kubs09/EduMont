/* eslint-disable */
const validateChild = (data) => {
  const errors = [];

  if (!data.firstname || data.firstname.length < 2 || data.firstname.length > 100) {
    errors.push('First name must be between 2 and 100 characters');
  }

  if (!data.surname || data.surname.length < 2 || data.surname.length > 100) {
    errors.push('Surname must be between 2 and 100 characters');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date_of_birth)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  } else {
    const birthDate = new Date(data.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 18) {
      errors.push('Child age must be between 0 and 18 years');
    }
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

const validateParentIds = (parentIds, isRequired = false) => {
  const errors = [];
  if (!parentIds || parentIds.length === 0) {
    if (isRequired) {
      errors.push('At least one parent must be selected');
    }
    return errors;
  }

  if (!Array.isArray(parentIds)) {
    errors.push('Parent IDs must be an array');
    return errors;
  }

  const invalidIds = parentIds.filter((id) => typeof id !== 'number' || Number.isNaN(id));
  if (invalidIds.length > 0) {
    errors.push('Parent IDs must be numbers');
  }

  return errors;
};

const validateChildUpdate = (data) => {
  const errors = [];

  if (!data.firstname || data.firstname.length < 2 || data.firstname.length > 100) {
    errors.push('First name must be between 2 and 100 characters');
  }

  if (!data.surname || data.surname.length < 2 || data.surname.length > 100) {
    errors.push('Surname must be between 2 and 100 characters');
  }

  if (data.date_of_birth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date_of_birth)) {
      errors.push('Invalid date format. Use YYYY-MM-DD');
    } else {
      const birthDate = new Date(data.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 18) {
        errors.push('Child age must be between 0 and 18 years');
      }
    }
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

module.exports = { validateChild, validateChildUpdate, validateParentIds };
