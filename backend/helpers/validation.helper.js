/**
 * Helper functions for data validation
 */

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean}
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId
 * @param {String} id - ID to validate
 * @returns {Boolean}
 */
exports.isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Sanitize string input
 * @param {String} str - String to sanitize
 * @returns {String}
 */
exports.sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Check if required fields are present
 * @param {Object} data - Data object to check
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { valid: Boolean, missing: Array }
 */
exports.checkRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  return {
    valid: missing.length === 0,
    missing
  };
};

