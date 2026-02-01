# Mietrecht Data Sources Documentation

## Overview

This document describes the data sources module for the Mietrecht Court Decisions Agent. The module is responsible for fetching German court decisions and legal information from various official and commercial sources.

## Data Sources

### 1. Bundesgerichtshof (BGH) - Federal Court of Justice

**URL**: https://juris.bundesgerichtshof.de

The BGH is Germany's highest court for civil and criminal matters. For Mietrecht cases, the VIII. Zivilsenat (Civil Senate) is particularly relevant.

**Key Information Extracted**:
- Case number (e.g., "VIII ZR 121/24")
- Decision date
- Court location (Karlsruhe)
- Judges involved
- Legal topics
- Summary of the decision
- Full decision text
- Practice implications

### 2. Landgerichte - Regional Courts

**URL**: Various regional court websites

Regional courts handle the majority of Mietrecht cases in Germany. Important decisions from higher regional courts (Oberlandesgerichte) are also included.

**Key Information Extracted**:
- Court name and location
- Case number
- Decision date
- Legal topics
- Summary of the decision
- Practice implications

### 3. Bundesverfassungsgericht (BVerfG) - Federal Constitutional Court

**URL**: https://www.bundesverfassungsgericht.de

The Federal Constitutional Court handles constitutional matters that may affect Mietrecht.

**Key Information Extracted**:
- Case number (e.g., "1 BvR 1234/23")
- Decision date
- Court location (Karlsruhe)
- Judges involved
- Constitutional principles
- Impact on existing jurisprudence

### 4. Beck-Online - Legal Database

**URL**: https://beck-online.beck.de

Commercial legal database with comprehensive coverage of German legal literature.

**Key Information Extracted**:
- Journal articles
- Commentary
- Case notes
- Legal analysis

## Technical Implementation

### Module Structure

The data sources module consists of the following functions:

1. `fetchBGHDecisions()` - Fetches decisions from the Federal Court of Justice
2. `fetchLandgerichtDecisions()` - Fetches decisions from regional courts
3. `fetchBVerfGDecisions()` - Fetches decisions from the Federal Constitutional Court
4. `fetchBeckOnlineData()` - Fetches articles and commentary from Beck-Online
5. `fetchAllCourtDecisions()` - Fetches from all sources concurrently

### Data Format

All functions return arrays of objects with the following structure:

```javascript
{
  id: "unique-identifier",
  court: "Court Name",
  location: "City",
  decisionDate: "YYYY-MM-DD",
  caseNumber: "Case Number",
  topics: ["Topic 1", "Topic 2"],
  summary: "Brief summary of the decision",
  fullText: "Full decision text",
  url: "Link to official decision",
  judges: ["Judge 1", "Judge 2"],
  practiceImplications: "Practical implications for lawyers",
  importance: "high|medium|low",
  source: "bgh|landgericht|bverfg|beck-online"
}
```

### Error Handling

The module implements robust error handling:
- Network timeouts
- HTTP error responses
- Parsing errors
- Fallback mechanisms

## Integration with Mietrecht Agent

The data sources module integrates with the Mietrecht Agent through:

1. **Data Fetching**: Called by the agent to retrieve current court decisions
2. **Filtering**: Results are filtered based on lawyer preferences
3. **Categorization**: Decisions are categorized by court type and topic
4. **Newsletter Generation**: Data is used to create personalized newsletters

## Configuration

The module can be configured through environment variables:

```env
# BGH API credentials (if available)
BGH_API_KEY=your-api-key

# Landgericht access credentials
LANDGERICHT_API_KEY=your-api-key

# Beck-Online credentials
BECK_ONLINE_API_KEY=your-api-key
```

## Future Enhancements

### Additional Data Sources
1. **NJW** - Neue Juristische Wochenschrift
2. **Mietrecht-Datenbanken** - Specialized rental law databases
3. **Deutsches Anwaltshandbuch** - Legal reference database

### Advanced Features
1. **Real-time notifications** for critical decisions
2. **Machine learning** for better categorization
3. **Natural language processing** for automatic summary generation
4. **Cross-reference analysis** between related cases

## Compliance Considerations

### Legal Compliance
- Comply with German data protection laws (GDPR)
- Respect court decision publication restrictions
- Maintain professional confidentiality
- Ensure proper attribution of sources

### Data Privacy
- Encrypt all stored personal data
- Implement access controls
- Provide data deletion upon request
- Regular security audits

## Testing

The module includes comprehensive tests:
- Unit tests for each data source function
- Integration tests for combined data fetching
- Error handling tests
- Performance tests

Run tests with:
```bash
npm run test-data-sources
```