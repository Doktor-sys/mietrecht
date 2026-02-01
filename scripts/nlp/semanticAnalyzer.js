/**
 * Semantic Analyzer for Mietrecht Agent
 * This module provides semantic text analysis capabilities.
 */

/**
 * Calculate semantic similarity between two texts
 * @param {String} text1 - First text
 * @param {String} text2 - Second text
 * @returns {Number} Similarity score (0-1)
 */
function calculateSemanticSimilarity(text1, text2) {
  // In a real implementation, this would use word embeddings or other semantic techniques
  // For now, we'll create a placeholder implementation
  
  if (!text1 || !text2 || typeof text1 !== 'string' || typeof text2 !== 'string') {
    return 0;
  }
  
  // Simple semantic similarity based on common words and phrases
  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
  
  const intersection = [...words1].filter(word => words2.has(word)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Extract key phrases from text using basic phrase detection
 * @param {String} text - Text to analyze
 * @returns {Array} Array of key phrases with weights
 */
function extractKeyPhrases(text) {
  // In a real implementation, this would use advanced phrase extraction techniques
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Simple approach: extract noun phrases and legal terms
  const legalTerms = [
    "Mietvertrag", "Kündigung", "Mietminderung", "Nebenkosten", 
    "Modernisierung", "Kaution", "Heizkosten", "Schimmel",
    "Vertragsstrafe", "Mietpreisbremse", "Zwangsmiete",
    "Betreiberpflichten", "Mieterrechte", "Vermieterrechte"
  ];
  
  const phrases = [];
  const lowerText = text.toLowerCase();
  
  // Extract legal terms
  legalTerms.forEach(term => {
    if (lowerText.includes(term.toLowerCase())) {
      phrases.push({
        phrase: term,
        weight: 0.9,
        type: "legal_term"
      });
    }
  });
  
  // Extract noun phrases (simplified pattern)
  const nounPhrasePattern = /\b([A-Z][a-z]+ [a-z]+)\b/g;
  const nounPhrases = text.match(nounPhrasePattern) || [];
  
  nounPhrases.forEach(phrase => {
    // Avoid duplicates
    if (!phrases.some(p => p.phrase === phrase)) {
      phrases.push({
        phrase,
        weight: 0.7,
        type: "noun_phrase"
      });
    }
  });
  
  // Sort by weight
  return phrases.sort((a, b) => b.weight - a.weight);
}

/**
 * Perform basic topic modeling using keyword frequency
 * @param {String} text - Text to analyze
 * @returns {Array} Array of topics with weights
 */
function performTopicModeling(text) {
  // In a real implementation, this would use advanced topic modeling algorithms
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Define topic keywords for mietrecht domain
  const topics = [
    {
      name: "Mietminderung",
      keywords: ["mietminderung", "mangel", "defekt", "reparatur", "schimmel", "heizung"],
      weight: 0
    },
    {
      name: "Kündigung",
      keywords: ["kündigung", "frist", "außerordentlich", "ordentlich", "vertragsende"],
      weight: 0
    },
    {
      name: "Nebenkosten",
      keywords: ["nebenkosten", "betriebskosten", "heizkosten", "wasserkosten", "abrechnung"],
      weight: 0
    },
    {
      name: "Mietpreisbremse",
      keywords: ["mietpreisbremse", "ortsüblich", "vergleichsmiete", "preisbegrenzung"],
      weight: 0
    },
    {
      name: "Modernisierung",
      keywords: ["modernisierung", "umbau", "sanierung", "aufwertung", "maßnahme"],
      weight: 0
    },
    {
      name: "Vertragsrecht",
      keywords: ["vertrag", "vertragspartner", "vertragsbedingung", "vertragsverhältnis"],
      weight: 0
    }
  ];
  
  const lowerText = text.toLowerCase();
  const totalWords = text.split(/\s+/).length;
  
  // Calculate topic weights based on keyword frequency
  topics.forEach(topic => {
    let keywordCount = 0;
    
    topic.keywords.forEach(keyword => {
      const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
      if (matches) {
        keywordCount += matches.length;
      }
    });
    
    // Normalize by total word count
    topic.weight = totalWords > 0 ? keywordCount / totalWords : 0;
  });
  
  // Filter out topics with zero weight and sort by weight
  return topics
    .filter(topic => topic.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Calculate document coherence score
 * @param {String} text - Text to analyze
 * @returns {Number} Coherence score (0-1)
 */
function calculateCoherence(text) {
  // In a real implementation, this would measure semantic coherence
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Simple coherence measure based on paragraph transitions and connectivity
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length < 2) {
    return 1; // Single paragraph is perfectly coherent
  }
  
  // Count transition words that indicate coherence
  const transitionWords = [
    "darüber hinaus", "zusätzlich", "weiterhin", "außerdem", "ebenfalls",
    "jedoch", "allerdings", "dennoch", "aber", "doch",
    "deshalb", "daher", "folglich", "somit", "dementsprechend",
    "zunächst", "danach", "anschließend", "schließlich", "abschließend"
  ];
  
  let transitionCount = 0;
  const lowerText = text.toLowerCase();
  
  transitionWords.forEach(word => {
    const matches = lowerText.match(new RegExp('\\b' + word + '\\b', 'g'));
    if (matches) {
      transitionCount += matches.length;
    }
  });
  
  // Normalize by number of paragraphs (expecting one transition per paragraph after the first)
  return Math.min(transitionCount / (paragraphs.length - 1), 1);
}

/**
 * Extract document structure information
 * @param {String} text - Text to analyze
 * @returns {Object} Document structure information
 */
function extractDocumentStructure(text) {
  // In a real implementation, this would parse document structure
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return {
      sections: [],
      headings: [],
      paragraphCount: 0,
      avgParagraphLength: 0
    };
  }
  
  // Simple structure extraction
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  
  // Estimate average paragraph length
  const totalLength = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const avgParagraphLength = paragraphCount > 0 ? totalLength / paragraphCount : 0;
  
  // Extract potential headings (lines that are shorter and possibly capitalized)
  const lines = text.split('\n');
  const headings = lines.filter(line => {
    return line.trim().length > 0 && 
           line.trim().length < 100 && 
           line.trim().toUpperCase() === line.trim();
  });
  
  return {
    sections: [], // Would be populated with actual section detection
    headings: headings.slice(0, 10), // Limit to first 10 potential headings
    paragraphCount,
    avgParagraphLength
  };
}

// Export functions
module.exports = {
  calculateSemanticSimilarity,
  extractKeyPhrases,
  performTopicModeling,
  calculateCoherence,
  extractDocumentStructure
};