const fs = require('fs');
const path = 'services/backend/prisma/schema.prisma';

try {
    let content = fs.readFileSync(path, 'utf8');
    // Find the end of the Integration model. 
    // Note: The file viewer showed CRLF or LF, let's look for the closing brace of the last valid model
    const marker = '@@map("integrations")';
    const index = content.lastIndexOf(marker);

    if (index !== -1) {
        // Find the closing brace after this marker
        const closingBraceIndex = content.indexOf('}', index);

        if (closingBraceIndex !== -1) {
            // Keep everything up to the closing brace }
            const cleanContent = content.substring(0, closingBraceIndex + 1);

            const newModel = `

model AuditLog {
  id            String   @id @default(cuid())
  timestamp     DateTime @default(now())
  eventType     String
  userId        String?
  tenantId      String?
  resourceType  String?
  resourceId    String?
  action        String
  result        String
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  hmacSignature String   @default("")

  @@index([timestamp])
  @@index([userId])
  @@index([tenantId])
  @@index([eventType])
  @@index([action])
  @@map("audit_logs")
}
`;
            fs.writeFileSync(path, cleanContent + newModel, 'utf8');
            console.log('Successfully fixed schema.prisma');
        } else {
            console.error('Closing brace not found for Integration model');
            process.exit(1);
        }
    } else {
        console.error('Marker @@map("integrations") not found');
        process.exit(1);
    }
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
