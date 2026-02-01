# Datenbank-Optimierungsplan

## 1. Neue Indizes

Folgende neue Indizes wurden zur Prisma-Schema-Datei hinzugefügt:

### Document-Modell
```prisma
@@index([userId, uploadedAt])
@@index([caseId, documentType])
@@index([userId, caseId])
@@index([organizationId, status])
@@index([documentType, status])
```

### Case-Modell
```prisma
@@index([userId, createdAt])
@@index([category, status])
@@index([priority, status])
@@index([userId, category])
```

### User-Modell
```prisma
@@index([email])
@@index([userType, isActive])
@@index([createdAt])
@@index([isVerified, isActive])
```

## 2. Query-Optimierung

### Effiziente Abfragen
- Verwendung von `select` und `include` zur Begrenzung der zurückgegebenen Daten
- Implementierung von Cursor-basierter Pagination statt OFFSET/LIMIT
- Verwendung von EXISTS statt IN für Subqueries

### Beispiele für optimierte Abfragen

#### Vorher (ineffizient):
```typescript
const documents = await prisma.document.findMany({
  where: {
    userId: userId
  }
});
```

#### Nachher (optimiert):
```typescript
const documents = await prisma.document.findMany({
  where: {
    userId: userId
  },
  select: {
    id: true,
    filename: true,
    documentType: true,
    status: true,
    uploadedAt: true
  },
  orderBy: {
    uploadedAt: 'desc'
  },
  take: 20
});
```

## 3. Connection Pooling

In der `.env`-Datei sollten folgende Einstellungen vorgenommen werden:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?connection_limit=20&pool_timeout=10
```

## 4. Datenbank-Wartung

Regelmäßige Wartungsaufgaben:

1. `VACUUM ANALYZE` - Aktualisiert Statistiken für den Query Planner
2. `ANALYZE` - Aktualisiert Statistiken für alle Tabellen
3. Überwachung langsamer Abfragen mit `pg_stat_statements`

## 5. Pagination-Optimierung

### Vorher (ineffizient):
```sql
SELECT * FROM documents WHERE userId = ? ORDER BY uploadedAt LIMIT 20 OFFSET 100
```

### Nachher (optimiert):
```sql
SELECT * FROM documents WHERE userId = ? AND uploadedAt < ? ORDER BY uploadedAt LIMIT 20
```

## 6. Implementierung

Die Optimierungen wurden in folgenden Dateien implementiert:

1. `prisma/schema.prisma` - Neue Indizes
2. `src/utils/dbOptimizer.ts` - Hilfsklasse für Datenbank-Optimierungen
3. Controller und Service-Dateien - Optimierung der Abfragen

## 7. Performance-Tests

Um die Verbesserungen zu messen, sollten folgende Tests durchgeführt werden:

1. Abfragezeiten vor und nach der Optimierung vergleichen
2. Lasttests mit verschiedenen Benutzerzahlen
3. Speicherbedarf überwachen
4. Datenbank-Statistiken analysieren