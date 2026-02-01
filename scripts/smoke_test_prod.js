const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log(`Starting Smoke Test against: ${BASE_URL}`);

const checkEndpoint = (path, name) => {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${path}`;
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.log(`✅ ${name}: OK (${res.statusCode})`);
                resolve();
            } else {
                console.error(`❌ ${name}: Failed (${res.statusCode})`);
                reject(new Error(`Status code ${res.statusCode}`));
            }
        });

        req.on('error', (err) => {
            console.error(`❌ ${name}: Network Error (${err.message})`);
            reject(err);
        });

        req.end();
    });
};

(async () => {
    try {
        await checkEndpoint('/health', 'Health Check');
        await checkEndpoint('/metrics', 'Metrics Endpoint');
        // Add more critical checks here
        console.log('\nAll checks passed! System looks healthy.');
        process.exit(0);
    } catch (error) {
        console.error('\nSmoke test failed!');
        process.exit(1);
    }
})();
