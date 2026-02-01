from flask import Flask, jsonify, request, send_from_directory, render_template_string
from flask_cors import CORS
import os
import base64
import requests
from openai import OpenAI
from dotenv import load_dotenv
import sqlite3
import json
import logging

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# AI Configuration - Aktualisierte Google AI Bibliothek
try:
    # Verwende die alte google-generativeai Bibliothek vorerst
    if os.environ.get("GOOGLE_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
            gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Google AI erfolgreich initialisiert")
        except ImportError:
            logger.warning("Google AI Bibliothek nicht verfügbar")
            gemini_model = None
    else:
        gemini_model = None
        logger.warning("GOOGLE_API_KEY nicht gefunden")

    if os.environ.get("OPENAI_API_KEY"):
        try:
            openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            logger.info("OpenAI erfolgreich initialisiert")
        except Exception as openai_error:
            logger.warning(f"OpenAI-Initialisierung fehlgeschlagen: {openai_error}")
            openai_client = None
    else:
        openai_client = None
        logger.warning("OPENAI_API_KEY nicht gefunden")
except Exception as e:
    logger.error(f"AI-Initialisierung fehlgeschlagen: {e}")
    gemini_model = None
    openai_client = None

# Database Configuration
DB_PATH = "juris_mind.db"

def init_db():
    """Initialisiert die Datenbank"""
    try:
        with sqlite3.connect(DB_PATH) as conn:
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
            conn.commit()
            logger.info("Datenbank erfolgreich initialisiert")
    except Exception as e:
        logger.error(f"Datenbankinitialisierung fehlgeschlagen: {e}")

init_db()

# Mietrecht-Wissensdatenbank
MIETRECHT_WISSEN = {
    "Mieterhöhung": {
        "KI-Einschätzung": "Der Vermieter darf die Miete bis zur ortsüblichen Vergleichsmiete erhöhen. Dies muss er schriftlich begründen (z.B. mit dem Mietspiegel). Es gelten Kappungsgrenzen (oft 15-20% in drei Jahren). Eine Mieterhöhung ist frühestens 15 Monate nach Einzug oder der letzten Erhöhung möglich.",
        "Professionelle Analyse": "Mieterhöhung bis zur ortsüblichen Vergleichsmiete nach § 558 BGB. Beachtung der Jahressperrfrist (15 Monate seit Einzug/letzter Erhöhung) und der Kappungsgrenze nach Landesverordnung. Auskunftspflicht des Vermieters über die Datengrundlage. Die Erhöhung muss schriftlich verlangt und begründet werden.",
        "Gerichtsurteile": "BGH VIII ZR 261/17 (Verwendung veralteter Mietspiegel); BGH VIII ZR 110/19 (Erhöhung nach Modernisierung vs. Vergleichsmiete).",
        "Handlungsempfehlungen": [
            "Prüfen Sie die Begründung der Mieterhöhung",
            "Vergleichen Sie mit dem aktuellen Mietspiegel",
            "Beachten Sie die 15-Monats-Sperrfrist",
            "Bei Zweifeln: Widerspruch innerhalb von 2 Monaten"
        ]
    },
    "Kündigung": {
        "KI-Einschätzung": "Eine Kündigung des Mietverhältnisses muss zwingend schriftlich erfolgen (Brief mit Originalunterschrift). Die Kündigungsfrist für Mieter beträgt in der Regel drei Monate. Eine Kündigung per E-Mail, Fax oder SMS ist rechtlich unwirksam.",
        "Professionelle Analyse": "Die ordentliche Kündigung durch den Mieter richtet sich nach § 573c BGB. Die Schriftform ist gemäß § 568 BGB zwingende Wirksamkeitsvoraussetzung. Bei einer Vermieterkündigung ist ein berechtigtes Interesse (§ 573 BGB) erforderlich. Mieter können gemäß § 574 BGB (Sozialklausel) widersprechen, wenn die Beendigung eine unzumutbare Härte darstellt.",
        "Gerichtsurteile": "BGH VIII ZR 107/13 (Präzisierung der Schriftform); BGH VIII ZR 270/15 (Anforderungen an die Begründung von Eigenbedarf).",
        "Handlungsempfehlungen": [
            "Kündigung immer schriftlich mit Originalunterschrift",
            "Kündigungsfrist beachten (meist 3 Monate)",
            "Bei Vermieterkündigung: Begründung prüfen",
            "Widerspruch bei Härtefall möglich"
        ]
    },
    "Mietminderung": {
        "KI-Einschätzung": "Wenn Ihre Wohnung Mängel aufweist (z.B. Schimmel, Heizungsausfall), dürfen Sie die Miete kürzen. Wichtig: Informieren Sie den Vermieter sofort schriftlich über den Mangel und kündigen Sie die Minderung an. Dokumentieren Sie den Mangel mit Fotos.",
        "Professionelle Analyse": "Der Minderungsanspruch ergibt sich unmittelbar aus § 536 BGB bei Vorliegen eines Sach- oder Rechtsmangels, der die Tauglichkeit zum vertragsgemäßen Gebrauch aufhebt oder mindert. Die Minderung tritt kraft Gesetzes ein. Eine Mängelanzeige gemäß § 536c BGB ist jedoch Voraussetzung für die Geltendmachung; unterbleibt sie, kann der Mieter schadenersatzpflichtig werden.",
        "Gerichtsurteile": "BGH VIII ZR 224/10 (Minderung bei Flächenabweichung > 10%); BGH VIII ZR 155/11 (Minderung bei Lärmbelästigung durch Nachbarn).",
        "Handlungsempfehlungen": [
            "Mangel sofort schriftlich dem Vermieter melden",
            "Mangel dokumentieren (Fotos, Zeugen)",
            "Angemessene Frist zur Beseitigung setzen",
            "Minderung erst nach Fristablauf"
        ]
    }
}

def analyze_legal_question(question):
    """Analysiert eine Rechtsfrage und gibt eine strukturierte Antwort zurück"""
    try:
        # Suche nach relevanten Themen in der Wissensdatenbank
        relevant_topics = []
        question_lower = question.lower()
        
        for topic, content in MIETRECHT_WISSEN.items():
            if any(keyword in question_lower for keyword in [
                topic.lower(),
                *[word for word in topic.lower().split()],
                *[word for word in content["KI-Einschätzung"].lower().split()[:10]]
            ]):
                relevant_topics.append((topic, content))
        
        if not relevant_topics:
            # Fallback: Verwende das erste Thema als Beispiel
            relevant_topics = [("Allgemeine Beratung", {
                "KI-Einschätzung": "Für eine präzise rechtliche Einschätzung benötige ich mehr Details zu Ihrem Fall. Bitte beschreiben Sie Ihre Situation genauer.",
                "Professionelle Analyse": "Eine fundierte rechtliche Beratung erfordert eine detaillierte Sachverhaltsdarstellung.",
                "Handlungsempfehlungen": ["Beschreiben Sie Ihren Fall detaillierter", "Sammeln Sie relevante Dokumente", "Bei komplexen Fällen: Anwalt konsultieren"]
            })]
        
        # Erstelle strukturierte Antwort
        response = {
            "status": "success",
            "question": question,
            "relevant_topics": []
        }
        
        for topic, content in relevant_topics[:2]:  # Maximal 2 relevante Themen
            topic_response = {
                "topic": topic,
                "ki_einschaetzung": content["KI-Einschätzung"],
                "professionelle_analyse": content.get("Professionelle Analyse", ""),
                "gerichtsurteile": content.get("Gerichtsurteile", ""),
                "handlungsempfehlungen": content.get("Handlungsempfehlungen", [])
            }
            response["relevant_topics"].append(topic_response)
        
        return response
        
    except Exception as e:
        logger.error(f"Fehler bei der Rechtsanalyse: {e}")
        return {
            "status": "error",
            "message": "Fehler bei der Analyse Ihrer Frage. Bitte versuchen Sie es erneut.",
            "error": str(e)
        }

@app.route("/smartlaw-agent")
@app.route("/smartlaw-agent/")
def smartlaw_agent():
    """Smartlaw Agent Route für Server-Deployment"""
    return home()

@app.route("/")
def home():
    """Hauptseite der Anwendung"""
    return render_template_string("""
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JurisMind SmartLaw Agent - Mietrecht</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Inter', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .card-hover:hover { transform: translateY(-5px); transition: all 0.3s ease; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="gradient-bg text-white py-8">
                <div class="container mx-auto px-4">
                    <h1 class="text-4xl font-bold text-center mb-4">
                        <i class="fas fa-balance-scale mr-3"></i>
                        JurisMind SmartLaw Agent
                    </h1>
                    <p class="text-xl text-center opacity-90">Ihr KI-gestützter Mietrechts-Assistent</p>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                <!-- Chat Interface -->
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 class="text-2xl font-semibold mb-4">
                            <i class="fas fa-comments text-blue-600 mr-2"></i>
                            Stellen Sie Ihre Mietrechtsfrage
                        </h2>
                        
                        <div class="mb-4">
                            <textarea 
                                id="question-input" 
                                class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                rows="4" 
                                placeholder="Beschreiben Sie Ihr mietrechtliches Problem, z.B.: 'Wann darf der Vermieter die Miete erhöhen?'"
                            ></textarea>
                        </div>
                        
                        <button 
                            onclick="analyzeQuestion()" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            <i class="fas fa-search mr-2"></i>
                            Frage analysieren
                        </button>
                    </div>

                    <!-- Results -->
                    <div id="results" class="hidden bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-xl font-semibold mb-4">
                            <i class="fas fa-gavel text-green-600 mr-2"></i>
                            Rechtliche Einschätzung
                        </h3>
                        <div id="results-content"></div>
                    </div>

                    <!-- Loading -->
                    <div id="loading" class="hidden text-center py-8">
                        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                        <p class="text-gray-600">Analysiere Ihre Frage...</p>
                    </div>
                </div>

                <!-- Quick Topics -->
                <div class="max-w-6xl mx-auto mt-12">
                    <h2 class="text-2xl font-semibold text-center mb-8">Häufige Mietrechtsthemen</h2>
                    <div class="grid md:grid-cols-3 gap-6">
                        <div class="bg-white rounded-lg shadow-md p-6 card-hover cursor-pointer" onclick="quickQuestion('Wann darf der Vermieter die Miete erhöhen?')">
                            <i class="fas fa-arrow-up text-red-500 text-2xl mb-3"></i>
                            <h3 class="font-semibold mb-2">Mieterhöhung</h3>
                            <p class="text-gray-600 text-sm">Regeln und Grenzen für Mieterhöhungen</p>
                        </div>
                        <div class="bg-white rounded-lg shadow-md p-6 card-hover cursor-pointer" onclick="quickQuestion('Wie kann ich die Miete mindern?')">
                            <i class="fas fa-arrow-down text-green-500 text-2xl mb-3"></i>
                            <h3 class="font-semibold mb-2">Mietminderung</h3>
                            <p class="text-gray-600 text-sm">Wann und wie Sie die Miete kürzen können</p>
                        </div>
                        <div class="bg-white rounded-lg shadow-md p-6 card-hover cursor-pointer" onclick="quickQuestion('Wie kündige ich meinen Mietvertrag?')">
                            <i class="fas fa-file-contract text-blue-500 text-2xl mb-3"></i>
                            <h3 class="font-semibold mb-2">Kündigung</h3>
                            <p class="text-gray-600 text-sm">Kündigungsfristen und -formen</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <script>
            function quickQuestion(question) {
                document.getElementById('question-input').value = question;
                analyzeQuestion();
            }

            async function analyzeQuestion() {
                const question = document.getElementById('question-input').value.trim();
                if (!question) {
                    alert('Bitte geben Sie eine Frage ein.');
                    return;
                }

                // Show loading
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('results').classList.add('hidden');

                try {
                    const response = await fetch('/smartlaw-agent/api/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ question: question })
                    });

                    const data = await response.json();
                    displayResults(data);
                } catch (error) {
                    console.error('Fehler:', error);
                    displayError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            }

            function displayResults(data) {
                const resultsDiv = document.getElementById('results-content');
                
                if (data.status === 'error') {
                    displayError(data.message);
                    return;
                }

                let html = '';
                data.relevant_topics.forEach(topic => {
                    html += `
                        <div class="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50">
                            <h4 class="font-semibold text-lg mb-3">${topic.topic}</h4>
                            
                            <div class="mb-4">
                                <h5 class="font-medium text-green-700 mb-2">
                                    <i class="fas fa-robot mr-1"></i> KI-Einschätzung:
                                </h5>
                                <p class="text-gray-700">${topic.ki_einschaetzung}</p>
                            </div>

                            ${topic.professionelle_analyse ? `
                            <div class="mb-4">
                                <h5 class="font-medium text-blue-700 mb-2">
                                    <i class="fas fa-graduation-cap mr-1"></i> Professionelle Analyse:
                                </h5>
                                <p class="text-gray-700 text-sm">${topic.professionelle_analyse}</p>
                            </div>
                            ` : ''}

                            ${topic.handlungsempfehlungen && topic.handlungsempfehlungen.length > 0 ? `
                            <div class="mb-4">
                                <h5 class="font-medium text-purple-700 mb-2">
                                    <i class="fas fa-list-check mr-1"></i> Handlungsempfehlungen:
                                </h5>
                                <ul class="list-disc list-inside text-gray-700 text-sm">
                                    ${topic.handlungsempfehlungen.map(emp => `<li>${emp}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}

                            ${topic.gerichtsurteile ? `
                            <div class="text-xs text-gray-500 mt-3">
                                <strong>Relevante Urteile:</strong> ${topic.gerichtsurteile}
                            </div>
                            ` : ''}
                        </div>
                    `;
                });

                resultsDiv.innerHTML = html;
                document.getElementById('results').classList.remove('hidden');
            }

            function displayError(message) {
                const resultsDiv = document.getElementById('results-content');
                resultsDiv.innerHTML = `
                    <div class="bg-red-50 border-l-4 border-red-500 p-4">
                        <div class="flex">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                            <p class="text-red-700">${message}</p>
                        </div>
                    </div>
                `;
                document.getElementById('results').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
    """)

@app.route("/smartlaw-agent/api/analyze", methods=["POST"])
@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    """API-Endpunkt für die Analyse von Rechtsfragen"""
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"status": "error", "message": "Keine Frage übermittelt"}), 400
        
        question = data['question'].strip()
        if not question:
            return jsonify({"status": "error", "message": "Leere Frage übermittelt"}), 400
        
        result = analyze_legal_question(question)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API-Fehler: {e}")
        return jsonify({
            "status": "error", 
            "message": "Interner Serverfehler"
        }), 500

@app.route("/smartlaw-agent/health")
@app.route("/health")
def health_check():
    """Gesundheitscheck für die Anwendung"""
    return jsonify({
        "status": "healthy",
        "timestamp": str(os.times()),
        "ai_services": {
            "google_ai": gemini_model is not None,
            "openai": openai_client is not None
        }
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    logger.info(f"Starte JurisMind SmartLaw Agent auf Port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)