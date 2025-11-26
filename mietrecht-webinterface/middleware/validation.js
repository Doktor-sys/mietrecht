/**
 * Validation middleware for Mietrecht Webinterface
 */

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  // Password should be at least 8 characters long
  return password.length >= 8;
}

// Validate lawyer data
function validateLawyerData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (data.password && !validatePassword(data.password)) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (data.lawFirm && data.lawFirm.length > 255) {
    errors.push('Law firm name is too long');
  }
  
  return errors;
}

// Validate preference data
function validatePreferenceData(data) {
  const errors = [];
  
  if (data.courtLevels && !Array.isArray(data.courtLevels)) {
    errors.push('Court levels must be an array');
  }
  
  if (data.topics && !Array.isArray(data.topics)) {
    errors.push('Topics must be an array');
  }
  
  if (data.frequency && !['daily', 'weekly', 'monthly'].includes(data.frequency)) {
    errors.push('Frequency must be daily, weekly, or monthly');
  }
  
  if (data.regions && !Array.isArray(data.regions)) {
    errors.push('Regions must be an array');
  }
  
  return errors;
}

// Validate court decision data
function validateCourtDecisionData(data) {
  const errors = [];
  
  if (!data.caseNumber || data.caseNumber.trim().length === 0) {
    errors.push('Case number is required');
  }
  
  if (!data.court || data.court.trim().length === 0) {
    errors.push('Court name is required');
  }
  
  if (data.caseNumber && data.caseNumber.length > 255) {
    errors.push('Case number is too long');
  }
  
  if (data.court && data.court.length > 255) {
    errors.push('Court name is too long');
  }
  
  if (data.location && data.location.length > 255) {
    errors.push('Location is too long');
  }
  
  if (data.importance && !['low', 'medium', 'high'].includes(data.importance)) {
    errors.push('Importance must be low, medium, or high');
  }
  
  return errors;
}

// Express middleware for validating lawyer data
function validateLawyer(req, res, next) {
  const errors = validateLawyerData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

// Express middleware for validating preference data
function validatePreferences(req, res, next) {
  const errors = validatePreferenceData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

// Express middleware for validating court decision data
function validateCourtDecision(req, res, next) {
  const errors = validateCourtDecisionData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

module.exports = {
  validateEmail,
  validatePassword,
  validateLawyerData,
  validatePreferenceData,
  validateCourtDecisionData,
  validateLawyer,
  validatePreferences,
  validateCourtDecision
};