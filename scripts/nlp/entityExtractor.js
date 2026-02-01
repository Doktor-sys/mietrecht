/**
 * Entity Extractor for Mietrecht Agent
 * This module provides advanced entity extraction capabilities.
 */

/**
 * Extract named entities from a court decision using advanced NER
 * @param {String} text - Full text of the court decision
 * @returns {Object} Extracted entities organized by type
 */
function extractNamedEntities(text) {
  // In a real implementation, this would use advanced NER models
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return {
      persons: [],
      organizations: [],
      locations: [],
      dates: [],
      legalReferences: [],
      courts: []
    };
  }
  
  // Simple mock implementation with improved pattern matching
  const persons = extractPersons(text);
  const organizations = extractOrganizations(text);
  const locations = extractLocations(text);
  const dates = extractDates(text);
  const legalReferences = extractLegalReferences(text);
  const courts = extractCourts(text);
  
  return {
    persons,
    organizations,
    locations,
    dates,
    legalReferences,
    courts
  };
}

/**
 * Extract person names from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of person entities with context
 */
function extractPersons(text) {
  // Improved pattern matching for German names
  const personPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
  const matches = text.match(personPattern) || [];
  
  // Remove common false positives
  const falsePositives = ['Bundesgerichtshof', 'Landgericht', 'Oberlandesgericht'];
  const filteredMatches = matches.filter(match => !falsePositives.includes(match));
  
  return filteredMatches.map(name => ({
    name,
    context: getContext(text, name),
    confidence: 0.8
  }));
}

/**
 * Extract organizations from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of organization entities
 */
function extractOrganizations(text) {
  // Pattern for organizations (German legal entities)
  const orgPatterns = [
    /\b([A-Z][a-z]+(?: [A-Z][a-z]+)*(?: GmbH|AG|KG|OHG|e\.V\.|GbR|UG))\b/g,
    /\b([A-Z][a-z]+(?: [A-Z][a-z]+)*-[A-Z][a-z]+)\b/g,
    /\b((?:Bundes|Landes|Oberlandes)?(?:gericht|verwaltung|behörde|amt))\b/g
  ];
  
  const organizations = [];
  
  orgPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      organizations.push({
        name: match,
        context: getContext(text, match),
        confidence: 0.75
      });
    });
  });
  
  // Remove duplicates
  const uniqueOrgs = [];
  const seen = new Set();
  
  organizations.forEach(org => {
    if (!seen.has(org.name)) {
      seen.add(org.name);
      uniqueOrgs.push(org);
    }
  });
  
  return uniqueOrgs;
}

/**
 * Extract locations from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of location entities
 */
function extractLocations(text) {
  // Pattern for German cities and regions
  const locationPattern = /\b([A-Z][a-z]+(?:stadt|burg|dorf|heim|hausen|tal))\b/g;
  const matches = text.match(locationPattern) || [];
  
  return matches.map(location => ({
    name: location,
    context: getContext(text, location),
    confidence: 0.7
  }));
}

/**
 * Extract dates from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of date entities
 */
function extractDates(text) {
  // Pattern for German dates (DD.MM.YYYY or DD. Month YYYY)
  const datePatterns = [
    /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g,
    /\b(\d{1,2}\. (?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4})\b/g
  ];
  
  const dates = [];
  
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      dates.push({
        date: match,
        context: getContext(text, match),
        confidence: 0.9
      });
    });
  });
  
  return dates;
}

/**
 * Extract legal references from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of legal reference entities
 */
function extractLegalReferences(text) {
  // Pattern for German legal references (§ X BGB, Art. X GG, etc.)
  const legalRefPatterns = [
    /\b(§§? \d+(?:\w?)(?: Abs\. \d+)?(?: Satz \d+)? (?:BGB|HGB|StGB|StPO|ZPO|VVG|BVerfGG|BRRG|WoGG))\b/g,
    /\b(Art\. \d+ (?:GG|EGG|VM))\b/g,
    /\b(EU(?:V|GV|VO|RL) Nr\. [\d\/]+\d{4})\b/g
  ];
  
  const legalRefs = [];
  
  legalRefPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      legalRefs.push({
        reference: match,
        context: getContext(text, match),
        confidence: 0.95
      });
    });
  });
  
  return legalRefs;
}

/**
 * Extract court names from text
 * @param {String} text - Text to analyze
 * @returns {Array} Array of court entities
 */
function extractCourts(text) {
  // Pattern for German courts
  const courtPatterns = [
    /\b(Bundesgerichtshof|BGH)\b/g,
    /\b(Bundesverfassungsgericht|BVerfG)\b/g,
    /\b(Landesgericht|LG) ([A-Z][a-z]+(?:stadt|burg|dorf)?)\b/g,
    /\b(Oberlandesgericht|OLG) ([A-Z][a-z]+(?:stadt|burg|dorf)?)\b/g,
    /\b(Amtsgericht|AG) ([A-Z][a-z]+(?:stadt|burg|dorf)?)\b/g
  ];
  
  const courts = [];
  
  courtPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      courts.push({
        name: match,
        context: getContext(text, match),
        confidence: 0.9
      });
    });
  });
  
  return courts;
}

/**
 * Get context around a matched entity
 * @param {String} text - Full text
 * @param {String} entity - Matched entity
 * @param {Number} contextLength - Number of characters to include as context
 * @returns {String} Context text
 */
function getContext(text, entity, contextLength = 50) {
  const index = text.indexOf(entity);
  if (index === -1) return "";
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + entity.length + contextLength);
  
  return text.substring(start, end).trim();
}

// Export functions
module.exports = {
  extractNamedEntities,
  extractPersons,
  extractOrganizations,
  extractLocations,
  extractDates,
  extractLegalReferences,
  extractCourts
};