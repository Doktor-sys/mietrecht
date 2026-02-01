"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EmailService_1 = require("../services/EmailService");
console.log('Import successful');
try {
    const service = new EmailService_1.EmailService();
    console.log('EmailService Instantiation successful');
}
catch (e) {
    console.error('EmailService Instantiation failed', e);
}
