/* eslint-disable */
const validateLanguage = (language) => {
  const validLanguages = ['cs', 'en'];
  return validLanguages.includes(language) ? language : 'cs';
};

const extractLanguage = (req) => {
  // Check headers first, then body, then query params
  const lang = req.headers['accept-language'] || req.body?.language || req.query?.language || 'cs';

  // Log for debugging
  console.log('Extracted language from request:', {
    headers: req.headers['accept-language'],
    body: req.body?.language,
    query: req.query?.language,
    final: lang,
  });

  return validateLanguage(lang.split(',')[0].trim().toLowerCase());
};

module.exports = {
  validateLanguage,
  extractLanguage,
};
