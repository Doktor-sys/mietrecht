import os
import json
import google.generativeai as genai
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class GeminiService:
    def __init__(self, google_key=None, openai_key=None):
        self.google_key = google_key
        self.openai_key = openai_key
        self.gemini_model = None
        self.openai_client = None

        if google_key:
            genai.configure(api_key=google_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')
        
        if openai_key and OpenAI:
            self.openai_client = OpenAI(api_key=openai_key)

    def analyze_custom_question(self, question):
        if not self.google_key and not self.openai_key:
            return self._get_mock_response(question)

        system_prompt = """
        Du bist JurisMind, ein hochspezialisierter KI-Rechtsassistent für deutsches Mietrecht.
        Deine Aufgabe ist es, komplexe Sachverhalte präzise zu analysieren und rechtlich fundierte Einschätzungen zu geben.
        
        Antworte IMMER im folgenden JSON-Format:
        {
            "KI-Einschätzung": "Eine kurze, verständliche Zusammenfassung für Laien.",
            "Professionelle Analyse": "Eine detaillierte juristische Analyse unter Einbeziehung relevanter BGB-Paragraphen.",
            "Gerichtsurteile": "Nenne konkrete, relevante Aktenzeichen (z.B. BGH) mit kurzem Leitsatz.",
            "Dokument-Typ": "Name des Berichts (z.B. Analyse zu Schimmelbildung)"
        }
        """

        try:
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Analysiere folgenden Fall eines Nutzers:\n'{question}'"}
                    ],
                    response_format={ "type": "json_object" },
                    temperature=0.2
                )
                return json.loads(response.choices[0].message.content)
            
            elif self.gemini_model:
                full_prompt = f"{system_prompt}\n\nAnalysiere folgenden Fall eines Nutzers:\n'{question}'"
                response = self.gemini_model.generate_content(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                return json.loads(response.text)
        except Exception as e:
            print(f"AI Service Error: {e}")
            raise e

    def analyze_document(self, file_content, mime_type):
        if not self.gemini_model:
            raise Exception("Gemini API nicht konfiguriert für Dokumenten-Analyse.")

        prompt = """
        Du bist ein KI-Rechtsassistent für Mietrecht. Analysiere das hochgeladene Dokument.
        Extrahiere die wichtigsten Informationen und identifiziere potenzielle rechtliche Probleme.
        
        Antworte IMMER im folgenden JSON-Format:
        {
            "KI-Einschätzung": "Zusammenfassung des Dokuments.",
            "Professionelle Analyse": "Juristische Analyse mit BGB-Bezug.",
            "Gerichtsurteile": "Relevante Rechtsprechung.",
            "Dokument-Typ": "Z.B. Mietvertrag"
        }
        """

        try:
            doc_part = {
                "mime_type": mime_type,
                "data": file_content
            }
            response = self.gemini_model.generate_content(
                [prompt, doc_part],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Document Service Error: {e}")
            raise e

    def _get_mock_response(self, question):
        q_lower = question.lower()
        if "e-bike" in q_lower and "laden" in q_lower:
            return {
                "KI-Einschätzung": "Das Laden von E-Bike-Akkus in der Wohnung ist grundsätzlich Teil des vertragsgemäßen Gebrauchs.",
                "Professionelle Analyse": "Gemäß § 535 Abs. 1 BGB hat der Mieter Anspruch auf den vertragsgemäßen Gebrauch.",
                "Gerichtsurteile": "LG Berlin 63 S 112/10",
                "Dokument-Typ": "Analyse zur E-Mobilität"
            }
        return {
            "KI-Einschätzung": f"Mock-Analyse für: {question}",
            "Professionelle Analyse": "Individuelle Fallprüfung basierend auf Mock-Daten.",
            "Gerichtsurteile": "BGH VIII ZR 189/17",
            "Dokument-Typ": "Individuelle Stellungnahme"
        }
