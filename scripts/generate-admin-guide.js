#!/usr/bin/env node

/**
 * Script to generate PDF version of the Admin User Guide
 * This script converts the HTML version of the admin guide to PDF
 */

const fs = require('fs');
const path = require('path');

// Check if puppeteer is installed, if not, exit gracefully
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.log('Puppeteer not installed. PDF generation skipped.');
    console.log('To generate PDF, install puppeteer with: npm install puppeteer');
    process.exit(0);
}

async function generatePDF() {
    console.log('Generating PDF version of Admin User Guide...');
    
    try {
        // Launch browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Load HTML file
        const htmlPath = path.join(__dirname, '..', 'docs', 'admin-user-guide.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Set content
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        
        // Generate PDF
        const pdfPath = path.join(__dirname, '..', 'docs', 'admin-user-guide.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        
        await browser.close();
        
        console.log(`✅ PDF generated successfully at: ${pdfPath}`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        process.exit(1);
    }
}

// Run the script
generatePDF().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});