import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import { config } from './config'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartLaw Mietrecht Agent API',
      version: '1.0.0',
      description: 'KI-gestützte Mietrechts-API für Deutschland. Diese API bietet Zugriff auf alle Funktionen des SmartLaw Mietrecht Agenten, einschließlich Benutzerauthentifizierung, Chat mit KI-Assistenten, Dokumentenverarbeitung, Rechtsdatenbankabfragen und vieles mehr.',
      contact: {
        name: 'SmartLaw Team',
        email: 'support@smartlaw.de',
        url: 'https://smartlaw.de',
      },
      license: {
        name: 'Proprietary',
        url: 'https://smartlaw.de/terms',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production' 
          ? 'https://api.smartlaw.de' 
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Benutzerauthentifizierung und Token-Management',
      },
      {
        name: 'Users',
        description: 'Benutzerprofile, Präferenzen und Kontoverwaltung',
      },
      {
        name: 'Chat',
        description: 'Echtzeit-Messaging mit KI und Anwälten',
      },
      {
        name: 'Documents',
        description: 'Dokumenten-Upload, Analyse und Generierung',
      },
      {
        name: 'Knowledge',
        description: 'Zugriff auf Rechtsdatenbanken und Suche',
      },
      {
        name: 'Lawyers',
        description: 'Anwaltssuche, Buchung und Beratung',
      },
      {
        name: 'Mietspiegel',
        description: 'Mietpreisspiegel-Daten und -Analysen',
      },
      {
        name: 'Bookings',
        description: 'Terminplanung und -verwaltung',
      },
      {
        name: 'Payments',
        description: 'Sichere Zahlungsabwicklung und Rechnungsstellung',
      },
      {
        name: 'B2B',
        description: 'Business-to-Business Integration und Partnerdienste',
      },
      {
        name: 'Webhooks',
        description: 'Externe Service-Integration',
      },
      {
        name: 'Audit',
        description: 'Sicherheits-Auditing und Compliance-Berichterstattung',
      },
      {
        name: 'KMS',
        description: 'Key Management System für kryptografische Sicherheit',
      },
      {
        name: 'Feedback',
        description: 'Benutzer-Feedback-Sammlung und -Analyse',
      },
      {
        name: 'GDPR',
        description: 'Datenschutz und DSGVO-Compliance',
      },
      {
        name: 'Security',
        description: 'Sicherheitsmonitoring und Vorfallmanagement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT-Token zur Authentifizierung. Fügen Sie "Bearer " vor dem Token hinzu.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validierungsfehler in den Eingabedaten',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            userType: {
              type: 'string',
              enum: ['tenant', 'landlord', 'business'],
            },
            profile: {
              $ref: '#/components/schemas/UserProfile',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
            },
            isVerified: {
              type: 'boolean',
            },
            isActive: {
              type: 'boolean',
            },
            preferences: {
              $ref: '#/components/schemas/UserPreferences',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            location: {
              type: 'string',
            },
            language: {
              type: 'string',
              enum: ['de', 'en', 'tr', 'ar'],
            },
            accessibilityNeeds: {
              type: 'object',
              properties: {
                screenReader: {
                  type: 'boolean',
                },
                highContrast: {
                  type: 'boolean',
                },
                largeText: {
                  type: 'boolean',
                },
                keyboardNavigation: {
                  type: 'boolean',
                },
              },
            },
          },
        },
        UserPreferences: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            notifications: {
              type: 'object',
              properties: {
                email: {
                  type: 'boolean',
                },
                push: {
                  type: 'boolean',
                },
                sms: {
                  type: 'boolean',
                },
              },
            },
            privacy: {
              type: 'object',
              properties: {
                dataSharing: {
                  type: 'boolean',
                },
                analytics: {
                  type: 'boolean',
                },
                marketing: {
                  type: 'boolean',
                },
              },
            },
            language: {
              type: 'string',
              enum: ['de', 'en', 'tr', 'ar'],
            },
          },
        },
        Case: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            category: {
              type: 'string',
              enum: ['rent_reduction', 'termination', 'rent_increase', 'utility_costs', 'repairs', 'deposit', 'modernization', 'other'],
            },
            status: {
              type: 'string',
              enum: ['open', 'resolved', 'escalated'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sender: {
              type: 'string',
              enum: ['user', 'ai', 'lawyer'],
            },
            content: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            metadata: {
              type: 'object',
              properties: {
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                },
                legalReferences: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/LegalReference',
                  },
                },
              },
            },
          },
        },
        LegalReference: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['law', 'court_decision', 'regulation'],
            },
            reference: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            relevantSection: {
              type: 'string',
            },
            url: {
              type: 'string',
              format: 'uri',
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            filename: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['rental_contract', 'utility_bill', 'warning_letter', 'other'],
            },
            size: {
              type: 'integer',
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Lawyer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            specializations: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            location: {
              type: 'string',
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
            },
            reviewCount: {
              type: 'integer',
            },
            hourlyRate: {
              type: 'number',
            },
            languages: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            verified: {
              type: 'boolean',
            },
          },
        },
        SearchResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['LAW', 'COURT_DECISION', 'REGULATION'],
            },
            reference: {
              type: 'string',
              example: '§ 536 BGB',
            },
            title: {
              type: 'string',
              example: 'Minderung der Miete bei Sach- und Rechtsmängeln',
            },
            content: {
              type: 'string',
            },
            jurisdiction: {
              type: 'string',
              example: 'Deutschland',
            },
            effectiveDate: {
              type: 'string',
              format: 'date-time',
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            score: {
              type: 'number',
              description: 'Relevanz-Score der Suche',
            },
            highlights: {
              type: 'object',
              properties: {
                title: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                content: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        LegalText: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            reference: {
              type: 'string',
              example: '§ 536 BGB',
            },
            title: {
              type: 'string',
              example: 'Minderung der Miete bei Sach- und Rechtsmängeln',
            },
            content: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['LAW', 'COURT_DECISION', 'REGULATION'],
            },
            jurisdiction: {
              type: 'string',
              example: 'Deutschland',
            },
            effectiveDate: {
              type: 'string',
              format: 'date-time',
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            relatedLaws: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LegalText',
              },
            },
          },
        },
        LegalKnowledge: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['LAW', 'COURT_DECISION', 'REGULATION'],
            },
            reference: {
              type: 'string',
              example: '§ 536 BGB',
            },
            title: {
              type: 'string',
              example: 'Minderung der Miete bei Sach- und Rechtsmängeln',
            },
            content: {
              type: 'string',
            },
            jurisdiction: {
              type: 'string',
              example: 'Deutschland',
            },
            effectiveDate: {
              type: 'string',
              format: 'date-time',
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            score: {
              type: 'number',
              description: 'Relevanz-Score bei Suchergebnissen',
            },
            highlights: {
              type: 'object',
              properties: {
                title: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                content: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        SecurityAlert: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Multiple failed login attempts',
            },
            message: {
              type: 'string',
              example: 'User john@example.com has 5 failed login attempts in 10 minutes',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            category: {
              type: 'string',
              enum: ['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'SYSTEM_INTEGRITY'],
            },
            source: {
              type: 'string',
              example: 'audit-service',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            metadata: {
              type: 'object',
            },
            acknowledged: {
              type: 'boolean',
            },
            acknowledgedAt: {
              type: 'string',
              format: 'date-time',
            },
            resolved: {
              type: 'boolean',
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            bookingId: {
              type: 'string',
              format: 'uuid',
            },
            amount: {
              type: 'number',
              example: 99.99,
            },
            currency: {
              type: 'string',
              example: 'EUR',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
            },
            paymentMethod: {
              type: 'string',
              example: 'credit_card',
            },
            transactionId: {
              type: 'string',
              example: 'txn_123456789',
            },
            clientSecret: {
              type: 'string',
              example: 'pi_123456789_secret_987654321',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            confirmedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            paymentId: {
              type: 'string',
              format: 'uuid',
            },
            invoiceNumber: {
              type: 'string',
              example: 'INV-2023-001',
            },
            amount: {
              type: 'number',
              example: 99.99,
            },
            currency: {
              type: 'string',
              example: 'EUR',
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'paid', 'overdue'],
            },
            issuedAt: {
              type: 'string',
              format: 'date-time',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
            },
            pdfUrl: {
              type: 'string',
              format: 'uri',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            lawyerId: {
              type: 'string',
              format: 'uuid',
            },
            timeSlotId: {
              type: 'string',
              format: 'uuid',
            },
            meetingType: {
              type: 'string',
              enum: ['VIDEO', 'PHONE', 'IN_PERSON'],
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
            },
            notes: {
              type: 'string',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            confirmedAt: {
              type: 'string',
              format: 'date-time',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TimeSlot: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            lawyerId: {
              type: 'string',
              format: 'uuid',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            isBooked: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Validierungsfehler',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validierungsfehler in den Eingabedaten',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
        AuthenticationError: {
          description: 'Authentifizierungsfehler',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'AUTHENTICATION_ERROR',
                  message: 'Ungültige Anmeldedaten',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
        ConflictError: {
          description: 'Konflikt mit vorhandenen Daten',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'CONFLICT_ERROR',
                  message: 'E-Mail-Adresse ist bereits registriert',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate Limit überschritten',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_ERROR',
                  message: 'Zu viele Anfragen',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource nicht gefunden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Benutzer nicht gefunden',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
        AuthorizationError: {
          description: 'Nicht autorisiert',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'AUTHORIZATION_ERROR',
                  message: 'Nicht autorisiert für diese Aktion',
                  timestamp: '2023-11-03T10:00:00.000Z'
                }
              }
            }
          }
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Pfade zu den Dateien mit API-Dokumentation
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express) => {
  // Swagger UI Setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SmartLaw API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }))

  // JSON Endpoint für die Swagger Specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}