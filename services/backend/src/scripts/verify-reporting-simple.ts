
import { ReportingService } from '../services/ReportingService';

console.log('Import successful');
try {
    const service = new ReportingService();
    console.log('Instantiation successful');
} catch (e) {
    console.error('Instantiation failed', e);
}
