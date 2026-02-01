# API Documentation for Risk Assessment and Strategy Recommendations

## Overview

This documentation covers the new API endpoints for risk assessment and strategy recommendations in the SmartLaw Mietrecht system. These endpoints provide advanced legal analysis capabilities powered by machine learning and natural language processing.

## Risk Assessment Endpoints

### Assess Document Risk

`POST /api/risk-assessment/document/:documentId`

Assesses the risk level of a specific document using natural language processing and machine learning techniques.

**Parameters:**
- `documentId` (path): The ID of the document to assess

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "risk123",
    "documentId": "doc123",
    "userId": "user123",
    "riskScore": 0.7,
    "riskLevel": "high",
    "details": {
      "summary": {
        "confidence": 0.8,
        "entities": {
          "totalEntities": 5
        },
        "topics": ["Mietvertrag", "Kündigung"]
      }
    }
  }
}
```

### Assess Case Risk

`POST /api/risk-assessment/case/:caseId`

Assesses the risk level of a legal case based on all associated documents and client data.

**Parameters:**
- `caseId` (path): The ID of the case to assess

**Request Body:**
```json
{
  "clientData": {
    "id": "client123",
    "riskTolerance": "medium"
  },
  "historicalData": {
    "cases": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "risk123",
    "caseId": "case123",
    "userId": "user123",
    "riskScore": 0.6,
    "riskLevel": "medium",
    "details": {
      "caseAnalysis": {
        "riskScore": 0.6
      },
      "clientProfile": {
        "id": "client123",
        "riskTolerance": "medium"
      }
    }
  }
}
```

### Enhanced Document Risk Assessment

`POST /api/risk-assessment/document/:documentId/enhanced`

Performs an enhanced risk assessment for a document using advanced machine learning models.

**Parameters:**
- `documentId` (path): The ID of the document to assess

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "risk123",
    "documentId": "doc123",
    "userId": "user123",
    "riskScore": 0.8,
    "riskLevel": "high",
    "isEnhanced": true,
    "details": {
      "confidence": 0.9,
      "topics": ["Mietvertrag", "Kündigung"],
      "entities": {
        "totalEntities": 5
      }
    }
  }
}
```

### Enhanced Case Risk Assessment

`POST /api/risk-assessment/case/:caseId/enhanced`

Performs an enhanced risk assessment for a legal case using historical data and advanced analytics.

**Parameters:**
- `caseId` (path): The ID of the case to assess

**Request Body:**
```json
{
  "clientData": {
    "id": "client123"
  },
  "historicalData": {
    "cases": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "risk123",
    "caseId": "case123",
    "userId": "user123",
    "riskScore": 0.8,
    "riskLevel": "high",
    "isEnhanced": true,
    "details": {
      "riskScore": 0.8,
      "riskLevel": "high",
      "confidence": 0.9
    }
  }
}
```

## Strategy Recommendations Endpoints

### Generate Document Recommendations

`POST /api/strategy-recommendations/document/:documentId`

Generates strategic recommendations based on a single document.

**Parameters:**
- `documentId` (path): The ID of the document to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "documentId": "doc123",
    "userId": "user123",
    "strategy": "Document-based strategy: Document summary",
    "confidence": 0.8,
    "recommendations": [
      {
        "id": "document_review",
        "title": "Dokumentenüberprüfung",
        "description": "Gründliche Überprüfung des Dokuments auf rechtliche Aspekte",
        "priority": "high",
        "confidence": 0.8
      }
    ]
  }
}
```

### Generate Case Recommendations

`POST /api/strategy-recommendations/case/:caseId`

Generates strategic recommendations for a legal case based on all associated documents and client data.

**Parameters:**
- `caseId` (path): The ID of the case to analyze

**Request Body:**
```json
{
  "clientData": {
    "id": "client123"
  },
  "lawyerData": {
    "id": "lawyer123"
  },
  "riskAssessment": {
    "score": 0.6
  },
  "historicalData": {
    "cases": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "caseId": "case123",
    "userId": "user123",
    "strategy": "Case strategy",
    "confidence": 0.7,
    "recommendations": [
      {
        "id": "rec1",
        "title": "Recommendation 1",
        "description": "Description 1",
        "priority": "high",
        "confidence": 0.7
      }
    ]
  }
}
```

### Enhanced Document Recommendations

`POST /api/strategy-recommendations/document/:documentId/enhanced`

Generates enhanced strategic recommendations for a document using advanced natural language processing.

**Parameters:**
- `documentId` (path): The ID of the document to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "documentId": "doc123",
    "userId": "user123",
    "strategy": "Enhanced document-based strategy: Document summary",
    "confidence": 0.9,
    "isEnhanced": true,
    "recommendations": [
      {
        "id": "enhanced_document_review",
        "title": "Erweiterte Dokumentenüberprüfung",
        "description": "Detaillierte Analyse des Dokuments mit Fokus auf: Mietvertrag, Kündigung",
        "priority": "high",
        "confidence": 0.9
      }
    ]
  }
}
```

### Enhanced Case Recommendations

`POST /api/strategy-recommendations/case/:caseId/enhanced`

Generates enhanced strategic recommendations for a legal case using machine learning and historical data analysis.

**Parameters:**
- `caseId` (path): The ID of the case to analyze

**Request Body:**
```json
{
  "clientData": {
    "id": "client123"
  },
  "lawyerData": {
    "id": "lawyer123"
  },
  "riskAssessment": {
    "score": 0.6
  },
  "historicalData": {
    "cases": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "caseId": "case123",
    "userId": "user123",
    "strategy": "Enhanced case strategy",
    "confidence": 0.9,
    "isEnhanced": true,
    "recommendations": [
      {
        "id": "en_rec1",
        "title": "Enhanced Recommendation 1",
        "description": "Enhanced Description 1",
        "priority": "high",
        "confidence": 0.9
      }
    ]
  }
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Implementation Details

### Risk Assessment Service

The risk assessment functionality is implemented in the following files:
- `src/controllers/RiskAssessmentController.ts`: Handles API requests and responses
- `scripts/ml/advancedRiskAssessment.js`: Contains the machine learning models for risk assessment
- `src/routes/risk-assessment.ts`: Defines the API routes

### Strategy Recommendations Service

The strategy recommendations functionality is implemented in the following files:
- `src/controllers/StrategyRecommendationsController.ts`: Handles API requests and responses
- `scripts/ml/enhancedStrategyRecommendations.js`: Contains the machine learning models for strategy recommendations
- `src/routes/strategy-recommendations.ts`: Defines the API routes

### Testing

Unit tests for the new functionality are located in:
- `src/tests/unit/risk-assessment.test.ts`
- `src/tests/unit/strategy-recommendations.test.ts`
- `src/tests/unit/advanced-risk-assessment.test.ts`
- `src/tests/unit/enhanced-strategy-recommendations.test.ts`

## Future Enhancements

Potential areas for future enhancement include:
1. **Real-time Risk Assessment**: Continuous risk assessment as new documents are added to a case
2. **Advanced Prediction Models**: Integration of more sophisticated machine learning models for risk prediction
3. **Personalized Recommendations**: Further personalization of strategy recommendations based on lawyer expertise and client history
4. **Integration with External Data Sources**: Incorporation of external legal databases and precedents into the analysis