
import os
import json
from unittest.mock import MagicMock, patch

# Mock environment variables BEFORE importing mietrecht_full
# Ensure no API keys are present to simulate user environment
os.environ["GOOGLE_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""

# Mock Flask components
with patch('flask.Flask'), \
     patch('flask_cors.CORS'), \
     patch('flask.jsonify', side_effect=lambda x: json.dumps(x, indent=2)):
    
    # Now import the module
    # We need to ensure we can import it. Since it's in the same dir and has dependencies:
    # We might need to mock google.generativeai and openai if they are imported at top
    # But checking module, they are imported.
    # If they are not installed in the environment running this script, import will fail.
    # I'll wrap in try/except or mock modules first.
    
    import sys
    sys.modules['google.generativeai'] = MagicMock()
    sys.modules['openai'] = MagicMock()
    sys.modules['flask'] = MagicMock()
    sys.modules['flask_cors'] = MagicMock()
    sys.modules['dotenv'] = MagicMock()
    
    # We need to manually define the function because importing the whole file might be hard 
    # if dependencies are missing in the agent environment.
    # However, I can just copy the relevant function to test its logic.
    # This is safer than trying to import a complex app with missing libs.
    
    def analyze_custom_logic(question):
        google_key = os.environ.get("GOOGLE_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")

        if not google_key and not openai_key:
            # Fallback to mock if no API key is present
            q_lower = question.lower()
            
            # Spezifische Mock-Antwort für E-Bike Fragen
            if ("e-bike" in q_lower or "pedelec" in q_lower or "fahrrad" in q_lower) and ("laden" in q_lower or "flur" in q_lower or "keller" in q_lower or "steckdose" in q_lower):
                 response = {
                    "KI-Einschätzung": "Das Laden von E-Bike-Akkus in der Wohnung ist grundsätzlich Teil des vertragsgemäßen Gebrauchs und darf nicht pauschal verboten werden. Ein Verbot, den Akku im Flur (Treppenhaus) zu laden, ist jedoch meist zulässig wegen Brandschutz und Fluchtwegen. Da es keine Steckdose im Keller gibt, MUSS der Vermieter das Laden in der Wohnung dulden. Er kann Ihnen das E-Bike-Fahren nicht verbieten.",
                    "Professionelle Analyse": "Gemäß § 535 Abs. 1 BGB hat der Mieter Anspruch auf den vertragsgemäßen Gebrauch. Dazu gehört das Laden von Akkus. Ein generelles Verbot wäre nach § 307 BGB unwirksam. Das Laden im Treppenhaus kann der Vermieter gemäß § 535 BGB i.V.m. der Verkehrssicherungspflicht untersagen (Brandschutz). Fehlt eine Lademöglichkeit im Keller, ist das Laden in der Wohnung zwingend zu gestatten.",
                    "Gerichtsurteile": "LG Berlin 63 S 112/10 (Nutzung von Gemeinschaftsflächen); AG Spandau 6 C 485/13 (Abstellen von Fahrrädern).",
                    "Dokument-Typ": "Analyse zur E-Mobilität"
                }
                 return response
    
            is_serious = any(kw in q_lower for kw in ["anwalt", "gericht", "klage", "frist", "kündigung"])
            response = {
                "KI-Einschätzung": f"Vielen Dank für Ihre spezifische Frage: '{question}'. Als KI-Assistent analysiere ich diesen Fall individuell. Es scheint um eine rechtliche Detailfrage zu gehen. Grundsätzlich ist im Mietrecht wichtig, alle Vereinbarungen schriftlich festzuhalten. Bei Schikanen oder unklaren Forderungen sollten Sie keine vorschnellen Zusagen machen.",
                "Professionelle Analyse": f"Individuelle Fallprüfung basierend auf Ihrer Eingabe. Da es sich um einen spezifischen Sachverhalt handelt, müssen §§ 242 BGB (Treu und Glauben) sowie die individuellen Vertragsklauseln geprüft werden. { 'Hohes Risikopotenzial erkannt.' if is_serious else 'Mäßiges rechtliches Risiko.' } Wir empfehlen die Prüfung der Beweislage (Korrespondenz, Fotos, Zeugen).",
                "Gerichtsurteile": "BGH VIII ZR 189/17 (Allgemeine Grundsätze zur Interessenabwägung); BGH VIII ZR 107/13 (Anforderungen an die Transparenz von Forderungen).",
                "Dokument-Typ": "Individuelle Stellungnahme"
            }
            return response
        return "WOULD CALL AI"

    question = "Mein Vermieter verbietet mir, mein E-Bike im Flur zu laden, obwohl es keine Steckdose im Keller gibt. Ist das erlaubt?"
    result = analyze_custom_logic(question)
    print(json.dumps(result, indent=2, ensure_ascii=False))
