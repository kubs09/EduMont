/* eslint-disable */
const validateLanguage = (language) => {
  const validLanguages = ['cs', 'en'];
  return validLanguages.includes(language) ? language : 'cs';
};

const extractLanguage = (req) => {
  const lang = req.headers['accept-language'] || req.body?.language || req.query?.language || 'cs';

  return validateLanguage(lang.split(',')[0].trim().toLowerCase());
};

module.exports = {
  validateLanguage,
  extractLanguage,
};
