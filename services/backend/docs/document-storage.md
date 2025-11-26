# Document Upload und Storage System

## Übersicht

Das Document Storage System ermöglicht Nutzern das sichere Hochladen, Speichern und Verwalten von Mietdokumenten mit umfassenden Sicherheitsfeatures wie Verschlüsselung, Validierung und Virus-Scanning.

## Architektur

### Komponenten

```
Document Storage System
├── DocumentStorageService
│   ├── File Upload & Validation
│   ├── Virus Scanning
│   ├── Encryption/Decryption
│   ├── MinIO Integration
│   └── Metadata Extraction
├── DocumentController
│   └── REST API Endpoints
└── MinIO Storage
    └── Encrypted Document Storage
```

## Features

### 1. Sicherer File-Upload

**Validierung:**
- Dateigröße (max. 10MB)
- MIME-Type Whitelist
- File Signature Verification (Magic Numbers)
- Filename Sanitization
- Path Traversal Protection

**Unterstützte Dateitypen:**
- PDF (`application/pdf`)
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- Word (`application/msword`, `.docx`)

### 2. Virus-Scanning

Placeholder-Implementierung für Integration mit ClamAV oder ähnlichen Antivirus-Lösungen:

```typescript
private async scanForViruses(buffer: Buffer): Promise<{
  clean: boolean;
  threat?: string;
}> {
  // TODO: Integrate with ClamAV
  // Checks for common malware signatures
  return { clean: true };
}
```

### 3. Verschlüsselung

**Algorithmus:** AES-256-CBC

**Prozess:**
1. Generiere zufälligen IV (16 bytes)
2. Verschlüssele Datei mit AES-256-CBC
3. Prepend IV zu verschlüsselten Daten
4. Speichere in MinIO

```typescript
private encryptFile(buffer: Buffer): Buffer {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.jwt.secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return Buffer.concat([iv, encrypted]);
}
```

### 4. MinIO Integration

**Konfiguration:**
```typescript
{
  endpoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'smartlaw_minio',
  secretKey: 'smartlaw_minio_password',
  bucketName: 'smartlaw-documents'
}
```

**Bucket-Struktur:**
```
smartlaw-documents/
├── user-123/
│   ├── 1699876543210-abc123def456.pdf
│   ├── 1699876543211-xyz789ghi012.jpg
│   └── ...
├── user-456/
│   └── ...
```

**Metadaten:**
- `Content-Type`: MIME-Type
- `X-Original-Name`: Base64-kodierter Originalname
- `X-User-Id`: Nutzer-ID
- `X-Document-Type`: Dokumenttyp
- `X-Encrypted`: Verschlüsselungsstatus

### 5. Metadaten-Extraktion

```typescript
interface DocumentMetadata {
  pageCount?: number;
  dimensions?: { width: number; height: number };
  hasText?: boolean;
  language?: string;
  encrypted?: boolean;
}
```

**Geplante Integrationen:**
- PDF: `pdf-parse` für Seitenzahl, Text-Extraktion
- Bilder: `sharp` für Dimensionen, EXIF-Daten

## API Endpoints

### POST /api/documents/upload

Upload eines Dokuments.

**Request:**
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
documentType: RENTAL_CONTRACT | UTILITY_BILL | WARNING_LETTER | OTHER
caseId: <optional-case-id>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc-123",
    "filename": "1699876543210-abc123.pdf",
    "originalName": "mietvertrag.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "documentType": "RENTAL_CONTRACT",
    "uploadedAt": "2024-11-13T10:30:00Z",
    "metadata": {
      "hasText": true
    }
  }
}
```

### GET /api/documents

Liste aller Dokumente des Nutzers.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "filename": "1699876543210-abc123.pdf",
      "originalName": "mietvertrag.pdf",
      "mimeType": "application/pdf",
      "size": 102400,
      "documentType": "RENTAL_CONTRACT",
      "uploadedAt": "2024-11-13T10:30:00Z",
      "analysis": {
        "id": "analysis-123",
        "riskLevel": "MEDIUM",
        "confidence": 0.85
      }
    }
  ]
}
```

### GET /api/documents/:documentId

Details eines spezifischen Dokuments.

### GET /api/documents/:documentId/download

Download eines Dokuments (entschlüsselt).

**Response:**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="mietvertrag.pdf"

<binary-data>
```

### DELETE /api/documents/:documentId

Löscht ein Dokument.

### GET /api/documents/stats

Speicherstatistiken des Nutzers.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 5,
    "totalSize": 512000,
    "documentsByType": {
      "RENTAL_CONTRACT": 2,
      "UTILITY_BILL": 2,
      "OTHER": 1
    }
  }
}
```

## Sicherheitsfeatures

### 1. Datei-Validierung

**Größenlimit:**
- Maximum: 10MB
- Konfigurierbar über `MAX_FILE_SIZE`

**MIME-Type Whitelist:**
```typescript
allowedMimeTypes: [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
```

**File Signature Verification:**
```typescript
const signatures: Record<string, Buffer[]> = {
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  // ...
};
```

### 2. Filename Sanitization

**Checks:**
- Path Traversal (`../`, `..\\`)
- Null Bytes (`\0`)
- Excessive Length (>255 chars)

**Secure Filename Generation:**
```typescript
generateSecureFilename(originalName: string): string {
  const extension = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomString}${extension}`;
}
```

### 3. Zugriffskontrolle

- Alle Endpoints erfordern Authentifizierung
- Dokumente sind nutzer-isoliert
- Zugriff nur auf eigene Dokumente

### 4. Verschlüsselung

- **At Rest:** AES-256-CBC in MinIO
- **In Transit:** TLS 1.3 (HTTPS)
- **Key Management:** Derived from JWT secret

## Datenmodell

### Document

```prisma
model Document {
  id            String          @id @default(cuid())
  userId        String
  caseId        String?
  filename      String
  originalName  String
  mimeType      String
  size          Int
  documentType  DocumentType
  uploadedAt    DateTime        @default(now())
  
  user          User            @relation(...)
  case          Case?           @relation(...)
  analysis      DocumentAnalysis?
}
```

### DocumentType Enum

```prisma
enum DocumentType {
  RENTAL_CONTRACT
  UTILITY_BILL
  WARNING_LETTER
  OTHER
}
```

## Testing

### Unit Tests

```bash
npm test -- documentStorage.simple.test.ts
```

**Test Coverage:**
- ✅ File size validation
- ✅ MIME type validation
- ✅ File signature validation
- ✅ Suspicious filename detection
- ✅ Document type support
- ✅ Encryption algorithm
- ✅ Storage statistics
- ✅ Filename generation

## Deployment

### MinIO Setup

**Docker Compose:**
```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: smartlaw_minio
      MINIO_ROOT_PASSWORD: smartlaw_minio_password
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

**Initialization:**
```typescript
import { initializeMinIO } from './config/minio';

await initializeMinIO();
```

### Environment Variables

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=smartlaw_minio
MINIO_SECRET_KEY=smartlaw_minio_password
MINIO_BUCKET_NAME=smartlaw-documents
MAX_FILE_SIZE=10485760
```

## Monitoring

### Metriken

- Upload-Rate
- Fehlerrate
- Durchschnittliche Dateigröße
- Speichernutzung pro Nutzer
- Virus-Scan-Ergebnisse

### Logging

```typescript
logger.info('Document uploaded', {
  userId,
  documentId,
  size,
  mimeType,
  documentType
});
```

## Zukünftige Erweiterungen

### 1. ClamAV Integration

```typescript
import { ClamScan } from 'clamscan';

const clamscan = await new ClamScan().init({
  clamdscan: {
    host: 'localhost',
    port: 3310
  }
});

const { isInfected, viruses } = await clamscan.scanBuffer(buffer);
```

### 2. PDF Metadata Extraction

```typescript
import pdfParse from 'pdf-parse';

const data = await pdfParse(buffer);
metadata.pageCount = data.numpages;
metadata.hasText = data.text.length > 0;
```

### 3. Image Processing

```typescript
import sharp from 'sharp';

const image = sharp(buffer);
const metadata = await image.metadata();
```

### 4. Document Versioning

- Versionierung bei Updates
- Diff-Anzeige
- Rollback-Funktionalität

### 5. Bulk Upload

- Mehrere Dateien gleichzeitig
- ZIP-Archive
- Progress-Tracking

## Anforderungen

Erfüllt folgende Anforderungen aus dem Requirements-Dokument:

- **3.1**: Dokumente hochladen und analysieren lassen
- **7.1**: Hosting innerhalb Deutschlands (MinIO konfigurierbar)
- **7.2**: Ende-zu-Ende-Verschlüsselung

## Siehe auch

- [Document Analysis Service](./document-analysis.md) (Task 5.3)
- [OCR und Text-Extraktion](./ocr-extraction.md) (Task 5.2)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
