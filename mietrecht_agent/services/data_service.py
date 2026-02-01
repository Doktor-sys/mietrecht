import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash

MIETRECHT_WISSEN = {
    "Kündigung": {
        "KI-Einschätzung": "Der Kündigungsschutz im deutschen Mietrecht ist sehr stark. Eine Kündigung durch den Vermieter ist nur unter strengen Voraussetzungen möglich (z.B. Eigenbedarf oder erhebliche Pflichtverletzung).",
        "Professionelle Analyse": "Prüfung gemäß §§ 573, 573c BGB. Bei Eigenbedarf müssen die Gründe im Kündigungsschreiben detailliert dargelegt werden. Eine Sozialklausel nach § 574 BGB kann die Kündigung verzögern oder verhindern.",
        "Gerichtsurteile": "BGH VIII ZR 167/17 (Anforderungen an Eigenbedarfskündigung); BGH VIII ZR 107/13 (Zahlungsverzug als Kündigungsgrund).",
        "Empfehlung": "Kündigungsschreiben auf Formfehler prüfen. Fristgerecht Widerspruch einlegen.",
        "Risiko": "Hoch",
        "Thema": "Kündigungsschutz"
    },
    "Mietminderung": {
        "KI-Einschätzung": "Bei erheblichen Mängeln der Mietsache (z.B. Schimmel, Heizungsausfall) haben Sie das Recht, die Miete angemessen zu mindern.",
        "Professionelle Analyse": "Rechtsgrundlage ist § 536 BGB. Die Minderung tritt kraft Gesetzes ein, sobald ein Mangel vorliegt, der die Tauglichkeit zum vertragsgemäßen Gebrauch mindert. Eine Mängelanzeige nach § 536c BGB ist zwingend.",
        "Gerichtsurteile": "BGH VIII ZR 224/97 (Heizungsausfall im Winter); BGH VIII ZR 181/07 (Lärmbelästigung durch Nachbarn).",
        "Empfehlung": "Mangel schriftlich anzeigen, Frist zur Behebung setzen, Miete unter Vorbehalt zahlen.",
        "Risiko": "Mittel",
        "Thema": "Mietminderung"
    },
    "Nebenkosten": {
        "KI-Einschätzung": "Nebenkostenabrechnungen sind oft fehlerhaft. Vermieter dürfen nur die mietvertraglich vereinbarten und tatsächlich angefallenen Kosten umlegen.",
        "Professionelle Analyse": "Gemäß § 556 BGB und der Betriebskostenverordnung (BetrKV). Die Abrechnung muss formell ordnungsgemäß sein und spätestens 12 Monate nach dem Abrechnungszeitraum vorliegen.",
        "Gerichtsurteile": "BGH VIII ZR 1/06 (Grundsatz der Wirtschaftlichkeit); BGH VIII ZR 133/08 (Anforderungen an die Erläuterung der Umlageschlüssel).",
        "Empfehlung": "Einsicht in die Belege fordern. Abrechnung auf unzulässige Positionen (z.B. Verwaltungskosten) prüfen.",
        "Risiko": "Gering",
        "Thema": "Betriebskosten"
    }
}

class DataService:
    def __init__(self, db_path):
        self.db_path = db_path
        self._init_db()
        self._seed_admin()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_identifier TEXT UNIQUE,
                    timestamp TEXT,
                    user_data TEXT,
                    case_data TEXT,
                    booking_data TEXT,
                    status TEXT
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    role TEXT
                )
            ''')
            conn.commit()

    def _seed_admin(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Seed only if empty
            cursor.execute("SELECT COUNT(*) FROM users")
            if cursor.fetchone()[0] == 0:
                pwd_hash = generate_password_hash("jurismind2026")
                cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                               ("admin@jurismind.de", pwd_hash, "partner"))
                conn.commit()

    def verify_user(self, email, password):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if user and check_password_hash(user['password_hash'], password):
                return {"id": user['id'], "email": user['email'], "role": user['role']}
        return None

    def get_topics(self):
        return list(MIETRECHT_WISSEN.keys())

    def get_topic_data(self, topic_name):
        for key in MIETRECHT_WISSEN:
            if key.lower() == topic_name.lower():
                return MIETRECHT_WISSEN[key]
        return None

    def save_booking(self, data):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM cases")
            count = cursor.fetchone()[0]
            case_id = f"JM-{count + 1001}"
            
            user_data = json.dumps({
                "name": data.get("userName"),
                "email": data.get("userEmail"),
                "phone": data.get("userPhone"),
                "address": data.get("userAddress")
            })
            
            case_data = json.dumps({
                "topic": data.get("topic"),
                "analysis": data.get("analysis"),
                "risk": data.get("risk"),
                "recommendation": data.get("recommendation")
            })
            
            booking_data = json.dumps({
                "lawyer": data.get("lawyer"),
                "type": data.get("consultationType"),
                "price": data.get("price"),
                "time": data.get("bookingTime")
            })
            
            cursor.execute('''
                INSERT INTO cases (case_identifier, timestamp, user_data, case_data, booking_data, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (case_id, data.get("timestamp"), user_data, case_data, booking_data, "Neu"))
            conn.commit()
            return case_id

    def update_case_status(self, case_id, status):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE cases SET status = ? WHERE case_identifier = ?
            ''', (status, case_id))
            conn.commit()

    def get_all_cases(self):
        cases = []
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cases ORDER BY id DESC")
            rows = cursor.fetchall()
            for row in rows:
                cases.append({
                    "id": row["case_identifier"],
                    "timestamp": row["timestamp"],
                    "user": json.loads(row["user_data"]),
                    "case": json.loads(row["case_data"]),
                    "booking": json.loads(row["booking_data"]),
                    "status": row["status"]
                })
        return cases
