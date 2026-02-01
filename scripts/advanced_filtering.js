/**
 * Advanced Filtering and Sorting System
 * This module provides advanced filtering and sorting capabilities for court decisions.
 */

/**
 * Filter decisions based on multiple criteria
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered array of decisions
 */
function filterDecisions(decisions, filters = {}) {
  console.log(`Filtering ${decisions.length} decisions with filters:`, filters);
  
  return decisions.filter(decision => {
    // Filter by court
    if (filters.court && filters.court.length > 0) {
      const courtMatch = filters.court.some(court => 
        decision.court.toLowerCase().includes(court.toLowerCase())
      );
      if (!courtMatch) return false;
    }
    
    // Filter by topics
    if (filters.topics && filters.topics.length > 0) {
      const topicMatch = filters.topics.some(topic => 
        decision.topics.some(decisionTopic => 
          decisionTopic.toLowerCase().includes(topic.toLowerCase())
        )
      );
      if (!topicMatch) return false;
    }
    
    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      const decisionDate = new Date(decision.decisionDate);
      
      if (filters.dateFrom && decisionDate < new Date(filters.dateFrom)) {
        return false;
      }
      
      if (filters.dateTo && decisionDate > new Date(filters.dateTo)) {
        return false;
      }
    }
    
    // Filter by importance
    if (filters.importance && filters.importance.length > 0) {
      if (!filters.importance.includes(decision.importance)) {
        return false;
      }
    }
    
    // Filter by location
    if (filters.location && filters.location.length > 0) {
      const locationMatch = filters.location.some(location => 
        decision.location.toLowerCase().includes(location.toLowerCase())
      );
      if (!locationMatch) return false;
    }
    
    // Filter by case number
    if (filters.caseNumber && filters.caseNumber.length > 0) {
      const caseNumberMatch = filters.caseNumber.some(caseNumber => 
        decision.caseNumber.toLowerCase().includes(caseNumber.toLowerCase())
      );
      if (!caseNumberMatch) return false;
    }
    
    // Filter by judges
    if (filters.judges && filters.judges.length > 0) {
      const judgeMatch = filters.judges.some(judge => 
        decision.judges.some(decisionJudge => 
          decisionJudge.toLowerCase().includes(judge.toLowerCase())
        )
      );
      if (!judgeMatch) return false;
    }
    
    // Custom filter function
    if (filters.customFilter && typeof filters.customFilter === 'function') {
      if (!filters.customFilter(decision)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort decisions based on specified criteria
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} sortOptions - Sorting options
 * @returns {Array} Sorted array of decisions
 */
function sortDecisions(decisions, sortOptions = {}) {
  console.log(`Sorting ${decisions.length} decisions with options:`, sortOptions);
  
  const { field = 'decisionDate', direction = 'desc' } = sortOptions;
  
  return decisions.sort((a, b) => {
    let valueA, valueB;
    
    // Handle different field types
    switch (field) {
      case 'decisionDate':
        valueA = new Date(a.decisionDate);
        valueB = new Date(b.decisionDate);
        break;
      case 'importance':
        // Define importance ranking
        const importanceRanking = { high: 3, medium: 2, low: 1 };
        valueA = importanceRanking[a.importance] || 0;
        valueB = importanceRanking[b.importance] || 0;
        break;
      case 'caseNumber':
        valueA = a.caseNumber;
        valueB = b.caseNumber;
        break;
      case 'court':
        valueA = a.court;
        valueB = b.court;
        break;
      default:
        // For other fields, use as strings
        valueA = a[field] ? a[field].toString() : '';
        valueB = b[field] ? b[field].toString() : '';
    }
    
    // Compare values
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      // String comparison
      const comparison = valueA.localeCompare(valueB);
      return direction === 'asc' ? comparison : -comparison;
    } else {
      // Numeric comparison
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
  });
}

/**
 * Paginate decisions
 * @param {Array} decisions - Array of court decision objects
 * @param {Number} page - Page number (1-based)
 * @param {Number} pageSize - Number of items per page
 * @returns {Object} Paginated results
 */
function paginateDecisions(decisions, page = 1, pageSize = 10) {
  console.log(`Paginating ${decisions.length} decisions - Page ${page}, Size ${pageSize}`);
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const paginatedDecisions = decisions.slice(startIndex, endIndex);
  
  return {
    decisions: paginatedDecisions,
    pagination: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: decisions.length,
      totalPages: Math.ceil(decisions.length / pageSize),
      hasNextPage: endIndex < decisions.length,
      hasPreviousPage: startIndex > 0
    }
  };
}

/**
 * Group decisions by a specific field
 * @param {Array} decisions - Array of court decision objects
 * @param {String} field - Field to group by
 * @returns {Object} Grouped decisions
 */
function groupDecisions(decisions, field) {
  console.log(`Grouping ${decisions.length} decisions by ${field}`);
  
  const grouped = {};
  
  decisions.forEach(decision => {
    const key = decision[field] || 'Unknown';
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    
    grouped[key].push(decision);
  });
  
  return grouped;
}

/**
 * Search decisions by text
 * @param {Array} decisions - Array of court decision objects
 * @param {String} query - Search query
 * @returns {Array} Array of decisions matching the query
 */
function searchDecisions(decisions, query) {
  console.log(`Searching ${decisions.length} decisions for query: ${query}`);
  
  if (!query || query.trim() === '') {
    return decisions;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return decisions.filter(decision => {
    // Search in multiple fields
    const searchableFields = [
      decision.caseNumber,
      decision.court,
      decision.location,
      decision.summary,
      decision.fullText,
      ...(decision.topics || []),
      ...(decision.judges || [])
    ];
    
    return searchableFields.some(field => {
      if (typeof field === 'string') {
        return field.toLowerCase().includes(normalizedQuery);
      }
      return false;
    });
  });
}

// Export functions
module.exports = {
  filterDecisions,
  sortDecisions,
  paginateDecisions,
  groupDecisions,
  searchDecisions
};