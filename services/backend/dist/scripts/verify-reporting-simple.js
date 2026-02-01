"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ReportingService_1 = require("../services/ReportingService");
console.log('Import successful');
try {
    const service = new ReportingService_1.ReportingService();
    console.log('Instantiation successful');
}
catch (e) {
    console.error('Instantiation failed', e);
}
