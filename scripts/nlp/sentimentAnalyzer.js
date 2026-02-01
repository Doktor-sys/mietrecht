/**
 * Sentiment Analyzer for Mietrecht Agent
 * This module provides sentiment and tone analysis capabilities.
 */

/**
 * Analyze sentiment of a court decision
 * @param {String} text - Full text of the court decision
 * @returns {Object} Sentiment analysis results
 */
function analyzeSentiment(text) {
  // In a real implementation, this would use advanced sentiment analysis models
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return {
      overall: "neutral",
      confidence: 0,
      polarity: 0,
      subjectivity: 0,
      emotionalTone: "neutral"
    };
  }
  
  // Simple sentiment analysis based on keyword detection
  const sentimentData = calculateSentimentScores(text);
  
  // Determine overall sentiment
  let overall = "neutral";
  if (sentimentData.polarity > 0.1) {
    overall = "positive";
  } else if (sentimentData.polarity < -0.1) {
    overall = "negative";
  }
  
  // Determine emotional tone
  const emotionalTone = determineEmotionalTone(text);
  
  return {
    overall,
    confidence: sentimentData.confidence,
    polarity: sentimentData.polarity,
    subjectivity: sentimentData.subjectivity,
    emotionalTone,
    positiveWords: sentimentData.positiveWords,
    negativeWords: sentimentData.negativeWords
  };
}

/**
 * Calculate sentiment scores based on keyword detection
 * @param {String} text - Text to analyze
 * @returns {Object} Sentiment scores
 */
function calculateSentimentScores(text) {
  // German legal sentiment keywords
  const positiveKeywords = [
    // Positive outcomes for plaintiffs
    "genehmigen", "akzeptieren", "zustimmen", "bestätigen", "erlauben", "annehmen",
    "zugesprochen", "bewilligen", "freisprechen", "rechtfertigen", "stützen",
    // Positive legal terms
    "rechtmäßig", "zulässig", "begründet", "wohlüberlegt", "sorgfältig",
    // Positive verbs
    "schützen", "wahren", "erhalten", "erfolgen", "klarstellen"
  ];
  
  const negativeKeywords = [
    // Negative outcomes for plaintiffs
    "ablehnen", "verbieten", "untersagen", "verweigern", "verletzen", "verstoßen",
    "widersprechen", "widerlegen", "widerlegen", "feststellen", "beanstanden",
    // Negative legal terms
    "unzulässig", " unbegründet", "willkürlich", "offensichtlich", "erheblich",
    // Negative verbs
    "schädigen", "benachteiligen", "gefährden", "verursachen", "verweigern"
  ];
  
  // Subjectivity indicators
  const subjectiveKeywords = [
    "offensichtlich", "erheblich", "wesentlich", "bedeutend", "geringfügig",
    "fraglich", "fraglos", "zweifellos", "fragwürdig", "bedenklich"
  ];
  
  const lowerText = text.toLowerCase();
  
  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;
  let subjectiveCount = 0;
  
  const positiveWords = [];
  const negativeWords = [];
  
  // Count positive keywords
  positiveKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) {
      positiveCount += matches.length;
      positiveWords.push(...matches);
    }
  });
  
  // Count negative keywords
  negativeKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) {
      negativeCount += matches.length;
      negativeWords.push(...matches);
    }
  });
  
  // Count subjective keywords
  subjectiveKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) {
      subjectiveCount += matches.length;
    }
  });
  
  // Calculate scores
  const totalSentimentWords = positiveCount + negativeCount;
  const polarity = totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0;
  
  const totalWords = text.split(/\s+/).length;
  const subjectivity = totalWords > 0 ? subjectiveCount / totalWords : 0;
  
  const confidence = Math.min(totalSentimentWords / 20, 1); // Max confidence at 20 sentiment words
  
  return {
    polarity,
    subjectivity,
    confidence,
    positiveWords: [...new Set(positiveWords)], // Remove duplicates
    negativeWords: [...new Set(negativeWords)]  // Remove duplicates
  };
}

/**
 * Determine emotional tone of text
 * @param {String} text - Text to analyze
 * @returns {String} Emotional tone
 */
function determineEmotionalTone(text) {
  // Keywords for different emotional tones
  const formalKeywords = [
    "gemäß", "gemäßigt", "ordnungsgemäß", "sachlich", "schriftlich", "rechtlich",
    "entsprechend", "angemessen", "ordnungswidrig", "rechtskräftig"
  ];
  
  const aggressiveKeywords = [
    "dringend", "sofort", "unverzüglich", "augenblicklich", "unmittelbar",
    "vehement", "strikt", "rigoros", "massiv", "erheblich"
  ];
  
  const cautiousKeywords = [
    "bedingt", "vorbehaltlich", "unter Vorbehalt", "mit Vorbehalt", "eventuell",
    "möglicherweise", "vermutlich", "wahrscheinlich", "annähernd", "nahezu"
  ];
  
  const lowerText = text.toLowerCase();
  
  // Count keywords for each tone
  let formalCount = 0;
  let aggressiveCount = 0;
  let cautiousCount = 0;
  
  formalKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) formalCount += matches.length;
  });
  
  aggressiveKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) aggressiveCount += matches.length;
  });
  
  cautiousKeywords.forEach(keyword => {
    const matches = lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) cautiousCount += matches.length;
  });
  
  // Determine dominant tone
  if (formalCount >= aggressiveCount && formalCount >= cautiousCount && formalCount > 0) {
    return "formal";
  } else if (aggressiveCount >= formalCount && aggressiveCount >= cautiousCount && aggressiveCount > 0) {
    return "aggressive";
  } else if (cautiousCount >= formalCount && cautiousCount >= aggressiveCount && cautiousCount > 0) {
    return "cautious";
  } else {
    return "neutral";
  }
}

/**
 * Analyze tone of specific sections of a court decision
 * @param {String} text - Full text of the court decision
 * @returns {Object} Section-wise tone analysis
 */
function analyzeSectionTone(text) {
  // In a real implementation, this would parse document structure
  // For now, we'll create a placeholder implementation
  
  if (!text || typeof text !== 'string') {
    return {};
  }
  
  // Simple mock implementation - assume standard court decision structure
  // Split text into approximate sections
  const paragraphs = text.split('\n\n');
  
  // Analyze tone of first few paragraphs (introductory)
  const introText = paragraphs.slice(0, 3).join(' ');
  const introTone = introText ? analyzeSentiment(introText) : null;
  
  // Analyze tone of middle paragraphs (reasoning)
  const midIndex = Math.floor(paragraphs.length / 2);
  const reasoningText = paragraphs.slice(midIndex - 1, midIndex + 2).join(' ');
  const reasoningTone = reasoningText ? analyzeSentiment(reasoningText) : null;
  
  // Analyze tone of last few paragraphs (conclusion)
  const conclusionText = paragraphs.slice(-3).join(' ');
  const conclusionTone = conclusionText ? analyzeSentiment(conclusionText) : null;
  
  return {
    introduction: introTone,
    reasoning: reasoningTone,
    conclusion: conclusionTone
  };
}

// Export functions
module.exports = {
  analyzeSentiment,
  calculateSentimentScores,
  determineEmotionalTone,
  analyzeSectionTone
};