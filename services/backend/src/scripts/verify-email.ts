
import { EmailService } from '../services/EmailService';

console.log('Import successful');
try {
    const service = new EmailService();
    console.log('EmailService Instantiation successful');
} catch (e) {
    console.error('EmailService Instantiation failed', e);
}
