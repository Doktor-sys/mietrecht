# API Documentation Implementation

## Overview
This document describes the implementation of comprehensive API documentation for the SmartLaw Mietrecht backend service using Swagger/OpenAPI.

## Features Implemented

### 1. Swagger UI Integration
- **Accessible Endpoint**: Documentation available at `/api-docs`
- **Interactive Interface**: Fully interactive API documentation
- **Schema Validation**: Request/response schemas validated against code
- **Authentication Support**: Built-in JWT token authentication

### 2. Comprehensive Endpoint Coverage
- **All REST Endpoints**: Documentation for all 17 API route modules
- **Detailed Examples**: Request/response examples for each endpoint
- **Error Responses**: Comprehensive error response documentation
- **Security Definitions**: Clear security requirements for each endpoint

### 3. Automated Documentation Updates
- **Code-First Approach**: Documentation automatically generated from code annotations
- **Real-time Updates**: Documentation updates with code changes
- **Schema Validation**: Ensures documentation matches implementation

### 4. Enhanced User Experience
- **Tag Organization**: Logical grouping of endpoints by functionality
- **Search Functionality**: Easy endpoint discovery
- **Response Duration**: Display of request processing time
- **Authorization Persistence**: Token persistence across sessions

## New Enhanced Profile Preferences Endpoints

### GET /api/users/preferences
Retrieves user preferences including enhanced profile settings for accessibility, legal topics, document preferences, and alerts.

### PUT /api/users/preferences
Updates user preferences with support for enhanced profile settings including:
- Accessibility settings (high contrast, dyslexia friendly, reduced motion, etc.)
- Legal topic preferences
- Frequently used document types
- Customizable alert notifications

## Implementation Details

### Documentation Generation
- **Swagger JSDoc**: Annotations in controller files generate OpenAPI specification
- **Route Scanning**: Automatic detection of all registered routes
- **Model Definitions**: TypeScript interfaces converted to OpenAPI schemas
- **Security Schemes**: JWT Bearer token authentication documented

### Access Points
- **Swagger UI**: Interactive documentation at `/api-docs`
- **JSON Specification**: Raw OpenAPI spec at `/api-docs-json`
- **YAML Specification**: Alternative format at `/api-docs-yaml`

### Security
- **JWT Authentication**: All protected endpoints require valid Bearer token
- **CSRF Protection**: Security headers included in all responses
- **Rate Limiting**: Documentation endpoints respect rate limiting policies

## Best Practices

### Documentation Maintenance
- Keep JSDoc annotations synchronized with code changes
- Provide clear examples for complex request/response structures
- Document all possible error responses
- Include detailed parameter descriptions

### Endpoint Design
- Use descriptive summary and description fields
- Provide concrete examples for request/response bodies
- Define clear success and error response structures
- Include relevant tags for logical grouping

## Error Handling

### Documentation Errors
- Invalid JSDoc annotations will prevent documentation generation
- Schema mismatches between documentation and implementation are detected
- Missing required fields in endpoint definitions are flagged

### User Experience
- Clear error messages
- Include timestamp and error codes

## Future Improvements

### Enhanced Features
- Integration with Postman for automated testing
- API versioning documentation
- Client SDK generation from documentation
- Performance benchmarking integration

### Advanced Documentation
- Tutorial-style endpoint guides
- Use case scenarios and examples
- Integration with external documentation systems
- Multi-language documentation support

### Monitoring and Analytics
- Documentation usage tracking
- Popular endpoint analytics
- User feedback collection
- Documentation quality metrics

## Troubleshooting

### Common Issues

1. **Documentation Not Loading**: Check if the backend server is running
2. **Missing Endpoints**: Verify JSDoc annotations in controller files
3. **Schema Validation Errors**: Ensure schemas match actual data structures
4. **Authentication Issues**: Check JWT token format and expiration

### Debugging

To debug API documentation issues:
1. Check server logs for Swagger-related errors
2. Verify JSDoc syntax in controller files
3. Test raw JSON specification endpoint
4. Validate OpenAPI specification compliance