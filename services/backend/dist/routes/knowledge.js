"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KnowledgeController_1 = require("../controllers/KnowledgeController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const knowledgeController = new KnowledgeController_1.KnowledgeController();
// Öffentliche Routen (keine Authentifizierung erforderlich)
router.get('/search', knowledgeController.searchLegalContent);
router.get('/legal-text/:reference', knowledgeController.getLegalText);
router.get('/similar/:reference', knowledgeController.findSimilarContent);
router.get('/health', knowledgeController.healthCheck);
// Business-Benutzer Routen (Authentifizierung und Autorisierung erforderlich)
router.post('/update', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserType.BUSINESS), knowledgeController.updateKnowledgeBase);
router.post('/add', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserType.BUSINESS), knowledgeController.addLegalContent);
router.put('/update/:reference', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserType.BUSINESS), knowledgeController.updateLegalContent);
router.delete('/delete/:reference', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserType.BUSINESS), knowledgeController.deleteLegalContent);
router.post('/initialize', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserType.BUSINESS), knowledgeController.initializeIndex);
exports.default = router;
