/**
 * Document Summarizer Module for SmartLaw Mietrecht
 * This module provides advanced natural language processing capabilities for legal document summarization.
 */

/**
 * Generate a comprehensive summary of a legal document
 * @param {Object} document - Legal document object
 * @returns {Object} Document summary with key elements
 */
function summarizeLegalDocument(document) {
  if (!document || !document.content) {
    return {
      summary: "Kein Dokumenteninhalt verfügbar.",
      keyPoints: [],
      entities: {},
      topics: [],
      sentiment: {},
      confidence: 0
    };
  }
  
  // Extract key information
  const content = document.content;
  
  // Perform multiple analyses
  const entities = extractEntities(content);
  const topics = extractTopics(content);
  const sentiment = analyzeSentiment(content);
  const keyPoints = extractKeyPoints(content);
  const legalIssues = identifyLegalIssues(content);
  
  // Generate summary
  const summary = generateSummary(content, keyPoints, legalIssues);
  
  // Calculate confidence
  const confidence = calculateSummaryConfidence(content, keyPoints, entities);
  
  return {
    summary,
    keyPoints,
    entities,
    topics,
    sentiment,
    legalIssues,
    confidence,
    summaryTimestamp: new Date().toISOString()
  };
}

/**
 * Extract named entities from document content
 * @param {String} content - Document content
 * @returns {Object} Extracted entities categorized by type
 */
function extractEntities(content) {
  // In a real implementation, this would use a proper NER system
  // For now, we'll use regex-based extraction for demonstration
  
  // Extract persons (names with capital letters)
  const personRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const persons = [...new Set(content.match(personRegex) || [])];
  
  // Extract organizations (entities with GmbH, AG, etc.)
  const orgRegex = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)* (?:GmbH|AG|KG|OHG|SE)\b/g;
  const organizations = [...new Set(content.match(orgRegex) || [])];
  
  // Extract dates
  const dateRegex = /\b\d{1,2}\.\d{1,2}\.\d{4}\b/g;
  const dates = [...new Set(content.match(dateRegex) || [])];
  
  // Extract monetary amounts
  const moneyRegex = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})? ?€\b/g;
  const monetaryAmounts = [...new Set(content.match(moneyRegex) || [])];
  
  // Extract contract types (Mietvertrag, Kaufvertrag, etc.)
  const contractRegex = /\b[Mm]iet(?:vertrag|verhältnis|recht)|[Kk]auf(?:vertrag|preis)|[Aa]rbeits(?:vertrag|recht)\b/g;
  const contractTypes = [...new Set(content.match(contractRegex) || [])];
  
  return {
    persons: persons.slice(0, 10), // Limit to top 10
    organizations: organizations.slice(0, 10),
    dates: dates.slice(0, 10),
    monetaryAmounts: monetaryAmounts.slice(0, 10),
    contractTypes: contractTypes.slice(0, 5),
    totalEntities: persons.length + organizations.length + dates.length + monetaryAmounts.length + contractTypes.length
  };
}

/**
 * Extract key topics from document content
 * @param {String} content - Document content
 * @returns {Array} Extracted topics
 */
function extractTopics(content) {
  // In a real implementation, this would use topic modeling
  // For now, we'll use keyword-based extraction for demonstration
  
  // Define legal topic keywords
  const topicKeywords = {
    "Mietminderung": ["Mietminderung", "Miethöhe", "Mietpreis", "Kostenmiete", "ortsüblich"],
    "Mietvertrag": ["Mietvertrag", "Vermieter", "Mieter", "Mietbeginn", "Mietende"],
    "Nebenkosten": ["Nebenkosten", "Betriebskosten", "Heizkosten", "Wartungskosten", "Instandhaltung"],
    "Kündigung": ["Kündigung", "fristlos", "außerordentlich", "ordentlich", "Kündigungsfrist"],
    "Modernisierung": ["Modernisierung", "Renovierung", "Verbesserung", "Aufwand", "Mehraufwand"],
    "Schadensersatz": ["Schadensersatz", "Schaden", "Verlust", "Ausfall", "Kostenerstattung"],
    "Mietpreisanpassung": ["Mietpreisanpassung", "Mieterhöhung", "Indexmiete", "Staffelmiete"],
    "Rechte des Mieters": ["Mitbestimmungsrecht", "Wohnrecht", "Eigentumsrecht", "Nutzungsrecht"]
  };
  
  const topics = [];
  
  // Check for each topic
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      count += matches ? matches.length : 0;
    }
    
    // If topic appears more than twice, consider it relevant
    if (count > 2) {
      topics.push({
        name: topic,
        relevance: count,
        keywords: keywords.slice(0, 3)
      });
    }
  }
  
  // Sort by relevance
  return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

/**
 * Analyze sentiment of document content
 * @param {String} content - Document content
 * @returns {Object} Sentiment analysis results
 */
function analyzeSentiment(content) {
  // In a real implementation, this would use a proper sentiment analyzer
  // For now, we'll use a simple keyword-based approach for demonstration
  
  // Define sentiment keywords
  const positiveWords = [
    "erfolgreich", "positiv", "gut", "angemessen", "korrekt", "ordnungsgemäß", 
    "rechtzeitig", "vorteilhaft", "akzeptabel", "zufriedenstellend", "klar", "deutlich"
  ];
  
  const negativeWords = [
    "problematisch", "negativ", "schlecht", "unangemessen", "fehlerhaft", "verspätet",
    "ungünstig", "ablehnend", "widersprüchlich", "unklar", "fragwürdig", "bedenklich"
  ];
  
  const neutralWords = [
    "gemäß", "entsprechend", "gemäßigt", "neutral", "ausgewogen", "standardmäßig"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  // Count occurrences
  for (const word of positiveWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    positiveCount += (content.match(regex) || []).length;
  }
  
  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    negativeCount += (content.match(regex) || []).length;
  }
  
  for (const word of neutralWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    neutralCount += (content.match(regex) || []).length;
  }
  
  // Calculate polarity (-1 to 1)
  const total = positiveCount + negativeCount + neutralCount;
  const polarity = total > 0 ? (positiveCount - negativeCount) / total : 0;
  
  // Determine sentiment label
  let sentimentLabel = "neutral";
  if (polarity > 0.1) {
    sentimentLabel = "positive";
  } else if (polarity < -0.1) {
    sentimentLabel = "negative";
  }
  
  return {
    polarity: parseFloat(polarity.toFixed(2)),
    sentiment: sentimentLabel,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    neutralWords: neutralCount,
    confidence: total > 0 ? Math.min(total / 50, 1) : 0 // Confidence based on word count
  };
}

/**
 * Extract key points from document content
 * @param {String} content - Document content
 * @returns {Array} Extracted key points
 */
function extractKeyPoints(content) {
  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Score sentences based on various factors
  const scoredSentences = sentences.map(sentence => {
    const trimmedSentence = sentence.trim();
    
    // Length score (prefer medium-length sentences)
    const lengthScore = Math.max(0, 1 - Math.abs(trimmedSentence.length - 100) / 100);
    
    // Keyword score (sentences with important legal terms)
    const legalKeywords = [
      "Mietvertrag", "Kündigung", "Mietminderung", "Nebenkosten", "Schadensersatz",
      "Verpflichtung", "Anspruch", "Frist", "Zahlung", "Vertragsende"
    ];
    
    let keywordCount = 0;
    for (const keyword of legalKeywords) {
      const regex = new RegExp(keyword, 'gi');
      keywordCount += (trimmedSentence.match(regex) || []).length;
    }
    
    const keywordScore = Math.min(keywordCount / 3, 1); // Normalize
    
    // Position score (earlier sentences are often more important)
    const positionScore = 1.0; // Simplified for this example
    
    // Combined score
    const combinedScore = (lengthScore * 0.3) + (keywordScore * 0.5) + (positionScore * 0.2);
    
    return {
      sentence: trimmedSentence,
      score: parseFloat(combinedScore.toFixed(2)),
      length: trimmedSentence.length,
      keywords: keywordCount
    };
  });
  
  // Sort by score and take top points
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence);
}

/**
 * Identify legal issues in document content
 * @param {String} content - Document content
 * @returns {Array} Identified legal issues
 */
function identifyLegalIssues(content) {
  // Define patterns for common legal issues
  const issuePatterns = [
    {
      id: "rent_reduction",
      name: "Mietminderung",
      pattern: /\b(Mietminderung|Mietpreisnachlass|Mietpreisanpassung)\b/i,
      context: /\b(Mangel|Defekt|Reparatur|Instandhaltung)\b/i
    },
    {
      id: "eviction",
      name: "Kündigung",
      pattern: /\b(Kündigung|gekündigt|Kündigungsfrist)\b/i,
      context: /\b(Vermieter|Mieter|fristlos|ordentlich)\b/i
    },
    {
      id: "additional_costs",
      name: "Nebenkosten",
      pattern: /\b(Nebenkosten|Betriebskosten|Heizkosten)\b/i,
      context: /\b(Aufteilung|Abrechnung|Vorauszahlung)\b/i
    },
    {
      id: "deposit",
      name: "Kaution",
      pattern: /\b(Kaution|Sicherheitseinbehalt)\b/i,
      context: /\b(Rückzahlung|Einbehalten|Frist)\b/i
    },
    {
      id: "modernization",
      name: "Modernisierung",
      pattern: /\b(Modernisierung|Renovierung|Verbesserung)\b/i,
      context: /\b(Mehraufwand|Mieterhöhung|Kosten)\b/i
    }
  ];
  
  const issues = [];
  
  // Check for each pattern
  for (const pattern of issuePatterns) {
    if (pattern.pattern.test(content) && pattern.context.test(content)) {
      issues.push({
        id: pattern.id,
        name: pattern.name,
        confidence: 0.8
      });
    }
  }
  
  return issues;
}

/**
 * Generate a summary of the document content
 * @param {String} content - Document content
 * @param {Array} keyPoints - Extracted key points
 * @param {Array} legalIssues - Identified legal issues
 * @returns {String} Generated summary
 */
function generateSummary(content, keyPoints, legalIssues) {
  // Start with general information
  let summary = "Dokumentenzusammenfassung: ";
  
  // Add information about document length
  const wordCount = content.split(/\s+/).length;
  summary += `Das Dokument besteht aus etwa ${wordCount} Wörtern. `;
  
  // Mention key points
  if (keyPoints && keyPoints.length > 0) {
    summary += "Wichtige Punkte des Dokuments: ";
    summary += keyPoints.slice(0, 3).join("; ") + ". ";
  }
  
  // Mention legal issues
  if (legalIssues && legalIssues.length > 0) {
    summary += "Identifizierte rechtliche Themen: ";
    summary += legalIssues.map(issue => issue.name).join(", ") + ". ";
  }
  
  // Add general characterization
  if (wordCount < 500) {
    summary += "Es handelt sich um ein kurzes Dokument. ";
  } else if (wordCount > 2000) {
    summary += "Es handelt sich um ein umfangreiches Dokument. ";
  }
  
  return summary.trim();
}

/**
 * Calculate confidence in the summary
 * @param {String} content - Document content
 * @param {Array} keyPoints - Extracted key points
 * @param {Object} entities - Extracted entities
 * @returns {Number} Confidence score (0-1)
 */
function calculateSummaryConfidence(content, keyPoints, entities) {
  let confidence = 0.5; // Base confidence
  
  // Increase for content length
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 200) {
    confidence += 0.2;
  } else if (wordCount > 100) {
    confidence += 0.1;
  }
  
  // Increase for identified key points
  if (keyPoints && keyPoints.length > 0) {
    confidence += Math.min(keyPoints.length * 0.05, 0.2);
  }
  
  // Increase for identified entities
  if (entities && entities.totalEntities > 0) {
    confidence += Math.min(entities.totalEntities * 0.02, 0.1);
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Compare two legal documents for similarities and differences
 * @param {Object} doc1 - First legal document
 * @param {Object} doc2 - Second legal document
 * @returns {Object} Comparison results
 */
function compareLegalDocuments(doc1, doc2) {
  if (!doc1 || !doc2 || !doc1.content || !doc2.content) {
    return {
      similarities: [],
      differences: [],
      confidence: 0
    };
  }
  
  // Get summaries for both documents
  const summary1 = summarizeLegalDocument(doc1);
  const summary2 = summarizeLegalDocument(doc2);
  
  // Find topic similarities
  const commonTopics = summary1.topics.filter(t1 => 
    summary2.topics.some(t2 => t2.name === t1.name)
  ).map(t => t.name);
  
  // Find entity similarities
  const commonPersons = summary1.entities.persons.filter(p1 => 
    summary2.entities.persons.includes(p1)
  );
  
  const commonOrganizations = summary1.entities.organizations.filter(o1 => 
    summary2.entities.organizations.includes(o1)
  );
  
  // Find differences in sentiment
  const sentimentDifference = Math.abs(summary1.sentiment.polarity - summary2.sentiment.polarity);
  
  // Compile similarities
  const similarities = [];
  if (commonTopics.length > 0) {
    similarities.push(`Gemeinsame Themen: ${commonTopics.join(", ")}`);
  }
  
  if (commonPersons.length > 0) {
    similarities.push(`Gemeinsame Personen: ${commonPersons.join(", ")}`);
  }
  
  if (commonOrganizations.length > 0) {
    similarities.push(`Gemeinsame Organisationen: ${commonOrganizations.join(", ")}`);
  }
  
  // Compile differences
  const differences = [];
  if (sentimentDifference > 0.3) {
    differences.push(`Unterschiedliche Stimmung: ${summary1.sentiment.sentiment} vs ${summary2.sentiment.sentiment}`);
  }
  
  // Add topic differences
  const uniqueTopics1 = summary1.topics.filter(t1 => 
    !summary2.topics.some(t2 => t2.name === t1.name)
  ).map(t => t.name);
  
  const uniqueTopics2 = summary2.topics.filter(t2 => 
    !summary1.topics.some(t1 => t1.name === t2.name)
  ).map(t => t.name);
  
  if (uniqueTopics1.length > 0) {
    differences.push(`Einzigartige Themen im ersten Dokument: ${uniqueTopics1.join(", ")}`);
  }
  
  if (uniqueTopics2.length > 0) {
    differences.push(`Einzigartige Themen im zweiten Dokument: ${uniqueTopics2.join(", ")}`);
  }
  
  // Calculate confidence
  const confidence = (similarities.length + (5 - differences.length)) / 10;
  
  return {
    similarities,
    differences,
    confidence: parseFloat(confidence.toFixed(2)),
    document1Summary: summary1,
    document2Summary: summary2
  };
}

// Export functions
module.exports = {
  summarizeLegalDocument,
  extractEntities,
  extractTopics,
  analyzeSentiment,
  extractKeyPoints,
  identifyLegalIssues,
  generateSummary,
  calculateSummaryConfidence,
  compareLegalDocuments
};