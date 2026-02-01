from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import base64
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
import sqlite3
import json

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# AI Configuration
try:
    if os.environ.get("GOOGLE_API_KEY"):
        genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        # Use gemini-1.5-flash as gemini-pro is deprecated/unavailable in v1beta
        gemini_model = genai.GenerativeModel('gemini-flash-latest')
    else:
        gemini_model = None

    if os.environ.get("OPENAI_API_KEY"):
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    else:
        openai_client = None
except Exception as e:
    print(f"Warning: AI initialization failed: {e}")
    gemini_model = None
    openai_client = None

# Database Configuration (Phase 3)
DB_PATH = "juris_mind.db"

def init_db():
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

init_db()

# Mietrecht-Wissensdatenbank (Professionelle Version)
MIETRECHT_WISSEN = {
    "Kündigung": {
        "KI-Einschätzung": "Eine Kündigung des Mietverhältnisses muss zwingend schriftlich erfolgen (Brief mit Originalunterschrift). Die Kündigungsfrist für Mieter beträgt in der Regel drei Monate. Eine Kündigung per E-Mail, Fax oder SMS ist rechtlich unwirksam.",
        "Professionelle Analyse": "Die ordentliche Kündigung durch den Mieter richtet sich nach § 573c BGB. Die Schriftform ist gemäß § 568 BGB zwingende Wirksamkeitsvoraussetzung. Bei einer Vermieterkündigung ist ein berechtigtes Interesse (§ 573 BGB) erforderlich. Mieter können gemäß § 574 BGB (Sozialklausel) widersprechen, wenn die Beendigung eine unzumutbare Härte darstellt.",
        "Gerichtsurteile": "BGH VIII ZR 107/13 (Präzisierung der Schriftform); BGH VIII ZR 270/15 (Anforderungen an die Begründung von Eigenbedarf)."
    },
    "Mietminderung": {
        "KI-Einschätzung": "Wenn Ihre Wohnung Mängel aufweist (z.B. Schimmel, Heizungsausfall), dürfen Sie die Miete kürzen. Wichtig: Informieren Sie den Vermieter sofort schriftlich über den Mangel und kündigen Sie die Minderung an. Dokumentieren Sie den Mangel mit Fotos.",
        "Professionelle Analyse": "Der Minderungsanspruch ergibt sich unmittelbar aus § 536 BGB bei Vorliegen eines Sach- oder Rechtsmangels, der die Tauglichkeit zum vertragsgemäßen Gebrauch aufhebt oder mindert. Die Minderung tritt kraft Gesetzes ein. Eine Mängelanzeige gemäß § 536c BGB ist jedoch Voraussetzung für die Geltendmachung; unterbleibt sie, kann der Mieter schadenersatzpflichtig werden.",
        "Gerichtsurteile": "BGH VIII ZR 224/10 (Minderung bei Flächenabweichung > 10%); BGH VIII ZR 155/11 (Minderung bei Lärmbelästigung durch Nachbarn)."
    },
    "Kaution": {
        "KI-Einschätzung": "Die Mietkaution darf höchstens drei Monatskaltmieten betragen. Sie darf in drei Raten gezahlt werden. Nach dem Auszug muss der Vermieter die Kaution inklusive Zinsen zurückzahlen, sobald alle Ansprüche geklärt sind (oft nach 3-6 Monaten).",
        "Professionelle Analyse": "Begrenzung der Mietsicherheit gemäß § 551 Abs. 1 BGB auf maximal drei Nettokaltmieten. Das Recht zur ratenweisen Zahlung ist in § 551 Abs. 2 BGB verankert. Die Anlagepflicht des Vermieters (getrennt vom Vermögen, verzinst) ergibt sich aus § 551 Abs. 3 BGB. Einbehaltungsrecht besteht nur für konkret bezifferbare Forderungen oder zu erwartende Nebenkostennachzahlungen.",
        "Gerichtsurteile": "BGH VIII ZR 234/13 (Rückzahlungsfrist und Prüfzeitraum); BGH VIII ZR 141/14 (Anlage der Kaution auf Treuhandkonto)."
    },
    "Nebenkosten": {
        "KI-Einschätzung": "Der Vermieter muss einmal im Jahr über die Nebenkosten abrechnen. Die Abrechnung muss spätestens 12 Monate nach Ende des Zeitraums bei Ihnen sein. Danach darf der Vermieter meist keine Nachzahlungen mehr fordern.",
        "Professionelle Analyse": "Umlagefähigkeit von Betriebskosten gemäß § 2 BetrKV und einzelvertraglicher Vereinbarung. Abrechnungsfrist und Ausschlussfrist nach § 556 Abs. 3 BGB. Der Mieter hat ein Recht auf Belegeinsicht (§ 259 BGB) zur Überprüfung der materiellen Richtigkeit.",
        "Gerichtsurteile": "BGH VIII ZR 189/17 (Franchise-Gebühren nicht umlagefähig); BGH VIII ZR 297/16 (Anforderungen an die Erläuterung der Umlageschlüssel)."
    },
    "Wohnrecht": {
        "KI-Einschätzung": "Ein lebenslanges Wohnrecht bedeutet, dass Sie in der Wohnung bleiben dürfen, auch wenn das Haus verkauft wird. Es sollte unbedingt im Grundbuch stehen. Meist müssen Sie nur die Nebenkosten zahlen, aber keine Miete.",
        "Professionelle Analyse": "Beschränkt persönliche Dienstbarkeit gemäß § 1093 BGB. Ausschluss des Eigentümers von der Nutzung. Dingliche Sicherung im Grundbuch ist für die Wirksamkeit gegenüber Dritten (z.B. Erwerbern) essenziell. Lastenverteilung richtet sich nach den §§ 1093, 1041 BGB.",
        "Gerichtsurteile": "BGH V ZR 311/11 (Umfang der Instandhaltungspflicht); BGH V ZR 15/14 (Löschung bei Unbewohnbarkeit)."
    },
    "Renovierung": {
        "KI-Einschätzung": "Grundsätzlich muss der Vermieter renovieren. Oft wird diese Pflicht aber im Mietvertrag auf den Mieter übertragen. Wenn die Klausel im Vertrag aber zu streng ist (z.B. feste Fristen ohne Ausnahme), ist sie unwirksam und Sie müssen gar nicht renovieren.",
        "Professionelle Analyse": "Überwälzung der Schönheitsreparaturen auf den Mieter gemäß § 535 Abs. 1 S. 2 BGB i.V.m. AGB-Kontrolle (§§ 307 ff. BGB). Unwirksamkeit bei 'starren Fristenplänen' (BGH VIII ZR 178/05) oder Quotenabgeltungsklauseln (BGH VIII ZR 185/14, VIII ZR 242/13). Bei unrenoviert übergebener Wohnung ist die Überwälzung meist unwirksam (BGH VIII ZR 185/14).",
        "Gerichtsurteile": "BGH VIII ZR 185/14 (Grundsatzurteil zur unrenovierten Übergabe); BGH VIII ZR 277/16 (Farbauswahl bei Auszug)."
    },
    "Modernisierung": {
        "KI-Einschätzung": "Der Vermieter darf die Wohnung modernisieren (z.B. neue Fenster, Dämmung), muss dies aber 3 Monate vorher ankündigen. Nachher darf er die Miete erhöhen (8% der Kosten pro Jahr). In Härtefällen können Sie widersprechen.",
        "Professionelle Analyse": "Duldungspflicht des Mieters gemäß § 555d BGB. Form- und fristgerechte Ankündigung nach § 555c BGB ist Wirksamkeitsvoraussetzung. Mieterhöhungsrecht nach § 559 BGB. Härtefalleinwand (§ 555d Abs. 2 BGB) muss innerhalb der Ausschlussfrist geltend gemacht werden.",
        "Gerichtsurteile": "BGH VIII ZR 121/16 (Anforderungen an die Ankündigung); BGH VIII ZR 10/18 (Erhöhung bei fiktiven Erhaltungsaufwendungen)."
    },
    "Rückzahlung": {
        "KI-Einschätzung": "Guthaben (z.B. aus Nebenkosten oder zu viel gezahlter Miete) muss der Vermieter sofort zurückzahlen. Bei der Kaution hat er allerdings meist 3-6 Monate Zeit zur Prüfung.",
        "Professionelle Analyse": "Rückzahlungsansprüche aus ungerechtfertigter Bereicherung (§ 812 BGB) oder vertraglichen Vereinbarungen (§ 535 BGB). Fälligkeit von Nebenkostenguthaben unmittelbar mit Erteilung (§ 556 BGB). Kautionsrückzahlung nach angemessener Prüfungs- und Überlegungsfrist.",
        "Gerichtsurteile": "BGH VIII ZR 234/13 (Prüfungsfrist bei Kaution); BGH VIII ZR 105/06 (Fälligkeit von Betriebskostenguthaben)."
    },
    "Hausordnung": {
        "KI-Einschätzung": "Die Hausordnung regelt das Miteinander (z.B. Ruhezeiten, Treppenhausreinigung). Sie ist für Sie nur bindend, wenn sie im Mietvertrag erwähnt wird. Unfaire Verbote (z.B. generelles Besuchsverbot) sind unwirksam.",
        "Professionelle Analyse": "Bestandteil des Mietvertrags oder einseitiges Leistungsbestimmungsrecht (§ 315 BGB) im Rahmen des ordnungsgemäßen Gebrauchs. Inhaltskontrolle nach §§ 307 ff. BGB. Regelungen zur Verkehrssicherungspflicht und zum Immissionsschutz.",
        "Gerichtsurteile": "BGH VIII ZR 307/12 (Reinigungspflichten); LG Frankfurt 2/25 O 285/04 (Grenzen des Besuchsverbots)."
    },
    "Tierhaltung": {
        "KI-Einschätzung": "Kleintiere (Fische, Hamster) dürfen Sie immer halten. Für Hunde und Katzen brauchen Sie meist die Erlaubnis, die der Vermieter aber nur mit gutem Grund verweigern darf. Ein generelles Verbot im Vertrag ist ungültig.",
        "Professionelle Analyse": "Einzelfallabwägung gemäß § 535 BGB i.V.m. § 307 BGB. Unwirksamkeit von Totalverboten (BGH VIII ZR 168/12). Interessenabwägung zwischen Mieterwunsch, Auswirkungen auf die Mietsache und Belästigung Dritter.",
        "Gerichtsurteile": "BGH VIII ZR 168/12 (Unwirksamkeit von generellen Tierhalteverboten); BGH VIII ZR 329/11 (Anspruch auf Zustimmung)."
    },
    "Wohnfläche": {
        "KI-Einschätzung": "Ist Ihre Wohnung mehr als 10% kleiner als im Vertrag steht? Dann dürfen Sie die Miete kürzen und zu viel gezahlte Miete zurückfordern. Die Berechnung erfolgt nach der Wohnflächenverordnung (Balkon zählt meist nur 25%).",
        "Professionelle Analyse": "Mangel der Mietsache gemäß § 536 BGB bei Flächenabweichung von > 10 % (BGH-Rechtsprechung). Anwendung der WoFlV zur Ermittlung der IST-Fläche. Rückforderungsansprüche für die Vergangenheit nach § 812 BGB.",
        "Gerichtsurteile": "BGH VIII ZR 295/03 (10%-Grenze); BGH VIII ZR 144/04 (Anwendbarkeit der WoFlV)."
    },
    "Wasserschaden": {
        "KI-Einschätzung": "Melden Sie einen Wasserschaden sofort dem Vermieter! Sie haben ein Recht auf Mietminderung, solange die Wohnung beeinträchtigt ist (z.B. durch Lärm von Trocknungsgeräten). Dokumentieren Sie Schäden an Ihren Möbeln für Ihre Hausratversicherung.",
        "Professionelle Analyse": "Mängelbeseitigungspflicht des Vermieters gemäß § 535 Abs. 1 BGB. Mietminderung kraft Gesetzes (§ 536 BGB). Schadensersatzansprüche bei Verschulden oder Verzug (§ 536a BGB). Beweislastverteilung bei Ursachen aus dem Verantwortungsbereich des Mieters vs. Vermieters.",
        "Gerichtsurteile": "BGH VIII ZR 161/12 (Minderung bei Feuchtigkeitsschäden); LG Berlin 65 S 158/11 (Minderungshöhe bei Trocknungsgeräten)."
    },
    "Lärm": {
        "KI-Einschätzung": "Bei dauerhaftem Lärm (Nachbarn, Baustelle) können Sie die Miete mindern. Wichtig: Führen Sie ein Lärmprotokoll (Datum, Uhrzeit, Art des Lärms). Nachtruhe ist von 22 bis 6 Uhr.",
        "Professionelle Analyse": "Sachmangel durch Immissionen gemäß § 536 BGB. Beweislast des Mieters durch Lärmprotokoll. Zumutbarkeitsschwelle und Ortsüblichkeit (§ 906 BGB analog). Recht zur fristlosen Kündigung bei Gesundheitsgefährdung (§ 569 BGB).",
        "Gerichtsurteile": "BGH VIII ZR 155/11 (Bolzplatzlärm); LG Berlin 65 S 158/11 (Minderung bei Bauarbeiten)."
    },
    "Räumung": {
        "KI-Einschätzung": "Eine Räumung darf nur mit einem Gerichtsurteil und durch einen Gerichtsvollzieher erfolgen. Der Vermieter darf nicht einfach Ihre Schlösser tauschen oder Ihre Sachen auf die Straße stellen ('Kalte Räumung' ist verboten!).",
        "Professionelle Analyse": "Vollstreckungstitel gemäß § 794 ZPO erforderlich. Räumungsschutzantrag nach § 765a ZPO bei existenzieller Gefährdung. Haftung des Vermieters bei nicht titulärer Besitzentsetzung (Schadenersatz für Hausrat).",
        "Gerichtsurteile": "BGH VIII ZR 45/09 (Schadenersatz bei kalter Räumung); BGH VIII ZR 102/11 (Berliner Räumung)."
    },
    "Mietvertrag": {
        "KI-Einschätzung": "Ein Mietvertrag regelt die Rechte und Pflichten von Mieter und Vermieter. Auch wenn er mündlich gelten kann, ist ein schriftlicher Vertrag dringend zu empfehlen. Achten Sie besonders auf Regelungen zu Kaution und Nebenkosten.",
        "Professionelle Analyse": "Gegenseitiger Vertrag nach § 535 BGB. Schriftformerfordernis bei Befristungen > 1 Jahr gemäß § 550 BGB (sonst gilt er als auf unbestimmte Zeit geschlossen). Instandhaltungslast liegt dispositiv beim Vermieter, kann aber unter Beachtung von §§ 305 ff. BGB (AGB-Kontrolle) teilweise übertragen werden.",
        "Gerichtsurteile": "BGH VIII ZR 185/14 (Konkretisierung der Instandhaltungspflicht); BGH VIII ZR 281/03 (Mündliche Mietverträge)."
    },
    "Mieterhöhung": {
        "KI-Einschätzung": "Der Vermieter darf die Miete bis zur ortsüblichen Vergleichsmiete erhöhen. Dies muss er schriftlich begründen (z.B. mit dem Mietspiegel). Es gelten Kappungsgrenzen (oft 15-20% in drei Jahren).",
        "Professionelle Analyse": "Mieterhöhung bis zur ortsüblichen Vergleichsmiete nach § 558 BGB. Beachtung der Jahressperrfrist (15 Monate seit Einzug/letzter Erhöhung) und der Kappungsgrenze nach Landesverordnung. Auskunftspflicht des Vermieters über die Datengrundlage.",
        "Gerichtsurteile": "BGH VIII ZR 261/17 (Verwendung veralteter Mietspiegel); BGH VIII ZR 110/19 (Erhöhung nach Modernisierung vs. Vergleichsmiete)."
    },
    "Unwirksame Klauseln": {
        "KI-Einschätzung": "Viele Klauseln in Mietverträgen sind ungültig, besonders zu Renovierung, Haustieren oder Kleinreparaturen. Wenn eine Klausel unwirksam ist, gilt stattdessen das Gesetz – oft zu Ihrem Vorteil. Lassen Sie Ihren Vertrag prüfen!",
        "Professionelle Analyse": "Inhaltskontrolle von AGB gemäß §§ 305 ff. BGB. Verstoß gegen das Transparenzgebot (§ 307 Abs. 1 S. 2 BGB) oder unangemessene Benachteiligung. Geltung der gesetzlichen Regelung bei Unwirksamkeit (§ 306 BGB).",
        "Gerichtsurteile": "BGH VIII ZR 185/14 (Summierungseffekt); BGH VIII ZR 168/12 (Generelles Tierhalteverbot)."
    },
    "Kleinreparaturen": {
        "KI-Einschätzung": "Sie müssen kleine Reparaturen (z.B. tropfender Wasserhahn) nur zahlen, wenn dies im Vertrag steht. Es muss eine Kostengrenze geben (meist bis 100€ pro Reparatur und ca. 250€ im Jahr). Größere Reparaturen zahlt immer der Vermieter.",
        "Professionelle Analyse": "Zulässigkeit der Abweichung von § 535 Abs. 1 BGB im Rahmen der AGB-Rechtsprechung. Notwendigkeit einer doppelten Obergrenze. Beschränkung auf Gegenstände, die dem direkten Zugriff des Mieters unterliegen.",
        "Gerichtsurteile": "BGH VIII ZR 91/88 (Grundsatzurteil zur Kleinreparatur); BGH VIII ZR 129/91 (Obergrenzen)."
    },
    "Kündigungsverzicht": {
        "KI-Einschätzung": "Ein Kündigungsverzicht (Sie dürfen z.B. 2 Jahre lang nicht kündigen) ist nur gültig, wenn er für beide Seiten gilt. Er darf maximal für 4 Jahre vereinbart werden. Für Studenten ist er oft unwirksam.",
        "Professionelle Analyse": "Zulässigkeit des beidseitigen Kündigungsverzichtes gemäß § 535 BGB i.V.m. § 307 BGB. Höchstdauer von 4 Jahren (BGH VIII ZR 27/04). Unwirksamkeit bei einseitiger Belastung des Mieters oder bei unangemessener Benachteiligung (z.B. bei Studenten).",
        "Gerichtsurteile": "BGH VIII ZR 27/04 (4-Jahres-Frist); BGH VIII ZR 307/08 (Unwirksamkeit bei Studenten)."
    },
    "Pauschalen": {
        "KI-Einschätzung": "Bei einer Nebenkostenpauschale zahlen Sie einen festen Betrag und bekommen keine Abrechnung. Das ist bei Kaltmiete oft okay, aber bei Heizkosten fast immer verboten – hier muss nach Verbrauch abgerechnet werden.",
        "Professionelle Analyse": "Vereinbarung einer Betriebskostenpauschale (§ 556 Abs. 2 BGB). Verbot der Pauschalierung von Heizkosten gemäß § 2 HeizkostenV (Ausnahme: Zweifamilienhaus mit Vermieterbewohnung). Recht zur Erhöhung nur bei ausdrücklichem Vorbehalt (§ 560 BGB).",
        "Gerichtsurteile": "BGH VIII ZR 212/04 (Heizkostenpauschale); BGH VIII ZR 106/11 (Erhöhung der Pauschale)."
    },
    "Wohnungsschlüssel": {
        "KI-Einschätzung": "Der Vermieter darf keinen Schlüssel zur Wohnung einbehalten, es sei denn, Sie haben dies ausdrücklich erlaubt. Sie haben das Recht auf Privatsphäre. Im Notfall muss der Vermieter versuchen, Sie zu erreichen, anstatt einfach die Wohnung zu betreten. Sie dürfen sogar den Schließzylinder austauschen (bewahren Sie das Original für den Auszug auf).",
        "Professionelle Analyse": "Alleiniges Besitzrecht des Mieters gemäß § 854 BGB. Der Vermieter ist verpflichtet, alle Schlüssel auszuhändigen. Einbehalt ohne Einwilligung ist eine Verletzung des Hausrechts (Art. 13 GG, § 123 StGB). Eigenmächtiges Betreten stellt verbotene Eigenmacht dar (§ 858 BGB). Der Mieter ist zum Austausch des Schlosses im Rahmen des vertragsgemäßen Gebrauchs berechtigt (§ 535 BGB).",
        "Gerichtsurteile": "BGH VIII ZR 164/70 (Aushändigungspflicht aller Schlüssel); OLG Celle 13 U 182/06 (Fristlose Kündigung bei unbefugtem Betreten)."
    },
    "Wohnungsübergabe": {
        "KI-Einschätzung": "Machen Sie bei der Übergabe unbedingt ein Protokoll und Fotos! Das schützt Sie vor unberechtigten Forderungen des Vermieters wegen angeblicher Schäden. Nehmen Sie am besten einen Zeugen mit. Geben Sie alle Schlüssel zurück und lassen Sie sich den Empfang quittieren.",
        "Professionelle Analyse": "Rückgabepflicht nach § 546 BGB. Das Übergabeprotokoll hat deklaratorische Wirkung und dient der Beweissicherung. Verjährung von Ersatzansprüchen des Vermieters in 6 Monaten (§ 548 BGB). Nutzungsentschädigung bei verspäteter Rückgabe (§ 546a BGB).",
        "Gerichtsurteile": "BGH VIII ZR 71/17 (Beweiswert des Übergabeprotokolls); BGH VIII ZR 104/09 (Anforderungen an die Rückgabe)."
    },
    "Untervermietung": {
        "KI-Einschätzung": "Sie brauchen grundsätzlich die Erlaubnis des Vermieters. Wenn Sie ein berechtigtes Interesse haben (z.B. Partner zieht ein, finanzielle Gründe), muss der Vermieter die Erlaubnis meist geben. Eine unerlaubte Untervermietung kann zur Kündigung führen.",
        "Professionelle Analyse": "Erlaubnisvorbehalt nach § 540 BGB. Anspruch auf Erlaubnis bei berechtigtem Interesse gemäß § 553 BGB (Teilüberlassung). Ablehnung nur aus wichtigem Grund in der Person des Dritten oder bei Überbelegung. Mieter haftet für Verschulden des Untermieters (§ 540 Abs. 2 BGB).",
        "Gerichtsurteile": "BGH VIII ZR 349/13 (Anspruch auf Untervermietung bei berechtigtem Interesse); BGH VIII ZR 210/14 (Kündigungsrecht bei fehlender Erlaubnis)."
    },
    "Eigentümerwechsel": {
        "KI-Einschätzung": "Der Grundsatz lautet: 'Kauf bricht nicht Miete'. Ihr Mietvertrag bleibt also genau so bestehen, wie er ist. Der neue Eigentümer darf nicht einfach die Miete erhöhen oder Sie kündigen, nur weil er neu ist. Er muss ein berechtigtes Interesse (z.B. Eigenbedarf) nachweisen.",
        "Professionelle Analyse": "Gesetzlicher Vertragseintritt des Erwerbers gemäß § 566 BGB. Der Erwerber tritt in alle Rechte und Pflichten ein. Rückgewährpflicht der Kaution bleibt subsidiär beim Veräußerer (§ 566a BGB). Kündigungsschutz bleibt unberührt; Eigenbedarf muss konkret dargelegt werden.",
        "Gerichtsurteile": "BGH VIII ZR 135/06 (Voraussetzungen des § 566 BGB); BGH VIII ZR 141/17 (Kaution bei Eigentümerwechsel)."
    },
    "Mietpreis": {
        "KI-Einschätzung": "In vielen Städten gilt die Mietpreisbremse: Bei neuen Verträgen darf die Miete maximal 10% über der ortsüblichen Vergleichsmiete liegen. Wenn Sie zu viel zahlen, müssen Sie das schriftlich rügen. Es gibt Ausnahmen für Neubauten und sanierte Wohnungen.",
        "Professionelle Analyse": "Vorschriften zur Miethöhe bei Mietbeginn (§§ 556d ff. BGB - Mietpreisbremse). Rügeobliegenheit des Mieters (§ 556g BGB). Ausnahmen für Neubauten (§ 556f BGB) und Erstvermietung nach umfassender Modernisierung. Rückforderungsansprüche bei Verstoß.",
        "Gerichtsurteile": "BVerfG 1 BvL 1/18 (Verfassungsmäßigkeit der Mietpreisbremse); BGH VIII ZR 1/19 (Anforderungen an die Rüge)."
    },
    "Vermieterfragen": {
        "KI-Einschätzung": "Der Vermieter darf nach Ihrem Einkommen, Beruf und Identität fragen. Fragen zu Kindern, Schwangerschaft, Religion oder politischer Einstellung sind verboten. Wenn der Vermieter solche unzulässigen Fragen stellt, brauchen Sie nicht die Wahrheit sagen ('Recht zur Lüge').",
        "Professionelle Analyse": "Datenerhebungsgrundsätze nach DSGVO und § 242 BGB (Treu und Glauben). Zulässigkeit von Fragen im Rahmen der vorvertraglichen Aufklärungspflicht. Schutz des Persönlichkeitsrechts (Art. 1, 2 GG). Notwehrrecht der Lüge bei unzulässigen Fragen nach ständiger Rechtsprechung.",
        "Gerichtsurteile": "BGH VIII ZR 107/13 (Grenzen der Informationspflicht); BAG 2 AZR 270/12 (analog: Recht zur Lüge bei unzulässigen Fragen)."
    }
}

@app.route("/")
def home():
    return '''
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JurisMind SmartLaw Agent</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Inter:wght@400;500;700;900&display=swap');

            :root {
                --primary: hsl(221, 83%, 53%);
                --primary-glow: hsla(221, 83%, 53%, 0.3);
                --secondary: hsl(222, 47%, 11%);
                --accent: hsl(199, 89%, 48%);
                --accent-soft: hsla(199, 89%, 48%, 0.1);
                --success: hsl(150, 100%, 35%);
                --bg-main: hsl(210, 40%, 98%);
                --glass: rgba(255, 255, 255, 0.75);
                --border-glass: rgba(255, 255, 255, 0.4);
                --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                --shadow-premium: 0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 10px 20px -10px rgba(15, 23, 42, 0.04);
            }

            body { 
                font-family: 'Inter', sans-serif; 
                background-color: var(--bg-main);
                background-image: 
                    radial-gradient(at 0% 0%, hsla(221, 83%, 53%, 0.05) 0px, transparent 50%),
                    radial-gradient(at 100% 0%, hsla(199, 89%, 48%, 0.05) 0px, transparent 50%);
                min-height: 100vh;
                color: var(--secondary);
                overflow-x: hidden;
            }

            h1, h2, h3, h4, .font-heading {
                font-family: 'Outfit', sans-serif;
            }

            .glass-card {
                background: var(--glass);
                backdrop-filter: blur(12px) saturate(180%);
                -webkit-backdrop-filter: blur(12px) saturate(180%);
                border: 1px solid var(--border-glass);
                box-shadow: var(--shadow-premium);
                border-radius: 32px;
            }

            .btn-primary {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark, #1d4ed8));
                color: white;
                box-shadow: 0 10px 20px -5px var(--primary-glow);
                transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            }

            .btn-primary:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 15px 30px -8px var(--primary-glow);
            }

            .topic-card {
                transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                border: 1px solid transparent;
            }

            .topic-card:hover { 
                transform: translateY(-8px); 
                box-shadow: var(--shadow-premium);
                background: white !important;
                border-color: var(--border-glass);
            }

            .stepper-active p { 
                background: var(--primary) !important; 
                color: white !important;
                border-color: var(--primary) !important;
                box-shadow: 0 0 20px var(--primary-glow);
            }
            .stepper-active span { color: var(--primary) !important; font-weight: 700; }

            .step-hidden { display: none !important; }
            .fade-in { animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
            
            .scale-in { animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

            .floating { animation: floating 3s ease-in-out infinite; }
            @keyframes floating { 
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .pulse-soft { animation: pulseSoft 2s infinite; }
            @keyframes pulseSoft {
                0% { box-shadow: 0 0 0 0 hsla(221, 83%, 53%, 0.4); }
                70% { box-shadow: 0 0 0 15px hsla(221, 83%, 53%, 0); }
                100% { box-shadow: 0 0 0 0 hsla(221, 83%, 53%, 0); }
            }

            /* Custom Transitions */
            .transition-premium { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }

            /* Modern Input Styles */
            input, textarea {
                background: hsla(210, 40%, 96%, 1) !important;
                border: 2px solid transparent !important;
                transition: all 0.3s ease !important;
            }
            input:focus, textarea:focus {
                background: white !important;
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 4px var(--primary-glow) !important;
            }

            /* Validation Styles */
            .input-error { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
            .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }

            /* Scrollbar */
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        </style>
    </head>
    <body class="text-slate-800">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- Loading Overlay -->
            <div id="loading-overlay" style="display: none;">
                <div class="spinner mb-4"></div>
                <p id="loading-text" class="text-slate-600 font-bold">Verarbeite...</p>
            </div>

            <!-- PayPal Mock Modal -->
            <div id="paypal-modal-backdrop" onclick="closePaypalModal()" style="display: none;"></div>
            <div id="paypal-modal" class="fade-in" style="display: none;">
                <!-- Login View -->
                <div id="paypal-login-view">
                    <div class="paypal-header">
                        <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" class="h-8 mx-auto">
                    </div>
                    <div class="paypal-body">
                        <h3 class="text-xl font-bold mb-6 text-center">Mit PayPal bezahlen</h3>
                        <input type="email" class="paypal-input" placeholder="E-Mail oder Mobilnummer" id="paypal-email">
                        <input type="password" class="paypal-input" placeholder="Passwort" id="paypal-pass">
                        <button class="paypal-btn mb-4" onclick="handlePaypalLogin()">Einloggen</button>
                        <div class="text-center">
                            <a href="#" class="text-blue-600 text-xs font-semibold">Passwort vergessen?</a>
                        </div>
                    </div>
                </div>

                <!-- NEW: Yellow Checkout View -->
                <div id="paypal-checkout-view" class="hidden">
                    <div class="bg-[#ffc439] p-6 text-center">
                        <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" class="h-8 mx-auto mb-4">
                        <h3 class="text-xl font-bold text-slate-800 mb-2">Zahlung überprüfen</h3>
                        <div class="bg-white/50 rounded-xl p-4 mb-6">
                            <p class="text-xs text-slate-600 uppercase font-bold tracking-widest mb-1">Betrag</p>
                            <p class="text-3xl font-black text-slate-900" id="paypal-checkout-amount">0,00 €</p>
                        </div>
                        <p class="text-sm text-slate-700 mb-6">Zahlung an <strong>JurisMind GmbH</strong></p>
                        <button class="w-full py-4 bg-slate-900 text-white rounded-full font-bold shadow-xl hover:bg-slate-800 transition-all mb-4" onclick="finalizePaypalPayment()">
                            Jetzt bezahlen
                        </button>
                        <p class="text-[10px] text-slate-600 uppercase font-bold">Sicher und verschlüsselt</p>
                    </div>
                    <div class="p-4 text-center bg-white">
                        <button class="text-sm text-slate-400 font-bold" onclick="closePaypalModal()">Abbrechen</button>
                    </div>
                </div>
            </div>

            <!-- SOFORT Mock Modal -->
            <div id="sofort-modal-backdrop" onclick="closeSofortModal()" style="display: none;"></div>
            <div id="sofort-modal" class="fade-in" style="display: none;">
                <div class="bg-[#f4f7f9] p-6 border-b border-slate-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                             <div class="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">SOFORT</div>
                             <span class="font-bold text-slate-800">Überweisung</span>
                        </div>
                        <img src="https://www.klarna.com/assets/sites/5/2020/04/27143923/klarna-logo-pink-rgb.png" alt="Klarna" class="h-4">
                    </div>
                </div>
                <div class="p-10 text-center bg-white">
                    <h3 class="text-2xl font-black text-slate-900 mb-4">Sicher bezahlen mit Ihrer Bank</h3>
                    <p class="text-slate-500 text-sm mb-8 leading-relaxed">Sie werden nun sicher zu Ihrem Online-Banking weitergeleitet, um die Zahlung für <strong>JurisMind GmbH</strong> zu autorisieren.</p>
                    
                    <div class="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 shadow-inner">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-400 uppercase font-black">Gesamtbetrag</span>
                            <span class="text-2xl font-black text-primary" id="sofort-price">0,00 €</span>
                        </div>
                    </div>

                    <button class="w-full py-5 bg-[#f5a9b8] hover:bg-[#ffb3c1] text-slate-900 rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1 mb-6" onclick="handleSofortRedirect()">
                        Weiter zur Bank
                    </button>
                    <button class="text-slate-400 text-sm font-black uppercase tracking-widest hover:text-slate-600 transition-colors" onclick="closeSofortModal()">Abbrechen</button>
                </div>
            </div>

            <!-- Main Content Container mit Padding -->
            <div class="py-12 px-4 sm:px-6 lg:px-8">
                <!-- Header Section -->
                <header class="text-center mb-16 max-w-4xl mx-auto">
                    <div class="inline-block px-4 py-1.5 mb-6 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 animate-pulse">
                        KI-Rechtsassistent 2.0
                    </div>
                    <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                        JurisMind <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">SmartLaw Agent</span>
                    </h1>
                    <p class="text-xl text-slate-500 mb-8 font-medium leading-relaxed">
                        Intelligente Konfliktlösung für Mieter und Vermieter. <br class="hidden md:block">
                        KI-gestützt, rechtssicher und <span class="text-blue-600 font-bold">sofort einsatzbereit</span>.
                    </p>
                </header>

                <!-- Stepper Section (Polished) -->
                <div class="max-w-6xl mx-auto mb-16 glass-card p-8 flex flex-wrap items-center justify-between">
                    <div class="flex flex-col mb-4 md:mb-0 pl-6 border-l-4 border-blue-600">
                        <span class="font-black text-xs text-slate-400 uppercase tracking-widest leading-tight mb-1">Status</span>
                        <span class="text-sm text-slate-900 font-black" id="step-info">Analyse wird vorbereitet...</span>
                    </div>
                    
                    <div class="flex flex-1 justify-center space-x-2 md:space-x-4 lg:space-x-10 px-6">
                        <div id="stepper-1" class="flex flex-col items-center transition-premium">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">1</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Start</span>
                        </div>
                        <div id="stepper-2" class="flex flex-col items-center transition-premium opacity-30">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">2</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Analyse</span>
                        </div>
                        <div id="stepper-3" class="flex flex-col items-center transition-premium opacity-30">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">3</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Matching</span>
                        </div>
                        <div id="stepper-4" class="flex flex-col items-center transition-premium opacity-30">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">4</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Anwalt</span>
                        </div>
                        <div id="stepper-5" class="flex flex-col items-center transition-premium opacity-30">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">5</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Termin</span>
                        </div>
                        <div id="stepper-6" class="flex flex-col items-center transition-premium opacity-30">
                            <p class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-slate-200 text-slate-300 bg-white mb-2 shadow-sm">6</p>
                            <span class="hidden md:block text-[10px] uppercase font-black tracking-widest text-slate-400">Erfolg</span>
                        </div>
                    </div>

                    <div class="hidden md:block w-32 text-right">
                        <span id="progress-text" class="text-lg font-black text-blue-600">17%</span>
                        <div class="w-full bg-slate-100 h-1 rounded-full mt-2 relative overflow-hidden">
                            <div id="progress-bar" class="absolute left-0 top-0 h-full bg-blue-600 transition-premium" style="width: 17%"></div>
                        </div>
                    </div>
                </div>

                <!-- STEP 1: Question & Topics -->
                <div id="view-step-1" class="fade-in">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div class="lg:col-span-8 space-y-10">
                            <div class="glass-card p-12 rounded-[40px] shadow-2xl relative overflow-hidden group border-blue-100/30">
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none"></div>
                                <h2 class="text-3xl font-black text-slate-900 mb-8 tracking-tight">Wie können wir Ihnen <span class="text-blue-600 italic">heute</span> helfen?</h2>
                                <div class="relative">
                                    <textarea id="question" rows="4" 
                                              class="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[32px] text-lg font-medium shadow-inner outline-none transition-premium"
                                              placeholder="Beschreiben Sie Ihr mietrechtliches Problem (z.B. Kaution, Kündigung, Mängel)..."></textarea>
                                    <button onclick="askQuestion()" 
                                            class="absolute right-6 bottom-6 px-10 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-premium flex items-center space-x-3">
                                        <i class="fas fa-bolt"></i>
                                        <span>KI-Check starten</span>
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-6">
                                <div class="flex items-center justify-between px-2">
                                    <h2 class="text-2xl font-black text-slate-900 tracking-tight">Themen-Übersicht</h2>
                                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sofort-Hilfe</span>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-6" id="topics-grid"></div>
                            </div>
                        </div>

                        <div class="lg:col-span-4 space-y-8">
                            <div class="glass-card p-10 rounded-[40px] shadow-xl min-h-[350px] flex flex-col relative overflow-hidden">
                                <div class="absolute top-0 right-0 p-8 opacity-10">
                                    <i class="fas fa-bolt text-7xl text-blue-600"></i>
                                </div>
                                <h2 class="text-2xl font-black text-slate-900 mb-8 tracking-tight">KI-Einschätzung</h2>
                                <div id="results-content" class="flex-1 flex flex-col items-center justify-center text-center">
                                    <div class="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                                        <i class="far fa-lightbulb text-4xl text-blue-300"></i>
                                    </div>
                                    <p class="text-slate-500 font-medium leading-relaxed">Stellen Sie eine Frage oder wählen Sie ein Thema links aus.</p>
                                </div>
                            </div>

                            <!-- Schnellaktionen -->
                            <div class="glass-card p-10 rounded-[40px] shadow-xl">
                                <h2 class="text-2xl font-black text-slate-900 mb-8 tracking-tight">Direkt-Dienste</h2>
                                <div class="grid grid-cols-1 gap-4">
                                    <button onclick="quickAction('Mietvertrag')" class="flex items-center space-x-4 p-5 bg-blue-50/50 text-blue-700 rounded-2xl hover:bg-blue-50 transition-all group border border-blue-100">
                                        <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <i class="fas fa-file-contract text-xl"></i>
                                        </div>
                                        <div class="text-left">
                                            <p class="text-sm font-black uppercase tracking-widest">Mietvertrag</p>
                                            <p class="text-xs font-medium text-blue-500/80">Rechtlich prüfen lassen</p>
                                        </div>
                                    </button>
                                    
                                    <!-- FILE UPLOAD ZONE -->
                                    <div id="upload-zone" class="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer text-center group" onclick="document.getElementById('doc-upload').click()">
                                        <input type="file" id="doc-upload" class="hidden" accept=".pdf,.jpg,.jpeg,.png" onchange="handleFileUpload(this)">
                                        <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <i class="fas fa-cloud-upload-alt text-blue-500"></i>
                                        </div>
                                        <p class="text-[10px] font-black text-slate-700 uppercase tracking-widest">Dokument hochladen (OCR)</p>
                                        <p class="text-[8px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">PDF, JPG, PNG zur Analyse</p>
                                    </div>

                                    <button onclick="quickAction('Kündigung')" class="flex items-center space-x-4 p-5 bg-green-50/50 text-green-700 rounded-2xl hover:bg-green-50 transition-all group border border-green-100">
                                        <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <i class="fas fa-file-signature text-xl"></i>
                                        </div>
                                        <div class="text-left">
                                            <p class="text-sm font-black uppercase tracking-widest">Kündigung</p>
                                            <p class="text-xs font-medium text-green-500/80">Schreiben erstellen</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- STEP 2: Professional Analysis -->
            <div id="view-step-2" class="step-hidden fade-in">
                <div class="max-w-4xl mx-auto space-y-10">
                    <div class="glass-card p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none"></div>
                        
                        <div class="flex flex-col md:flex-row justify-between items-start mb-10 border-b border-slate-100 pb-8 relative z-10">
                            <div>
                                <h2 class="text-4xl font-black text-slate-900 tracking-tight" id="analysis-title">Rechtliche Fachanalyse</h2>
                                <p class="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">JM-702-2B • Erstellt am <span id="current-date"></span></p>
                            </div>
                            <div class="mt-4 md:mt-0 px-6 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                                Berichtsstatus: Finalisiert
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 relative z-10" id="analysis-grid">
                            <!-- Populated via JS -->
                        </div>

                        <div class="bg-amber-50/50 border-l-8 border-amber-500 p-8 rounded-2xl mb-12 relative z-10">
                            <div class="flex items-center space-x-4 mb-4">
                                <div class="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                                    <i class="fas fa-triangle-exclamation"></i>
                                </div>
                                <h3 class="font-black text-amber-900 uppercase tracking-widest text-sm">Risikoeinschätzung</h3>
                            </div>
                            <p class="text-slate-700 font-medium leading-relaxed" id="analysis-risk">Basierend auf Ihrer Wahl besteht ein mittleres bis hohes Kostenrisiko bei nicht fristgerechter Reaktion.</p>
                        </div>

                        <div class="bg-slate-900 text-white p-10 rounded-[35px] shadow-2xl relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                <i class="fas fa-lightbulb text-9xl text-amber-400"></i>
                            </div>
                            <div class="relative z-10">
                                <div class="flex items-center space-x-4 mb-6">
                                    <div class="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-amber-400/20">
                                        <i class="fas fa-star text-xl"></i>
                                    </div>
                                    <h3 class="text-2xl font-black tracking-tight">Unsere Empfehlung</h3>
                                </div>
                                <p class="text-slate-300 text-lg leading-relaxed mb-10 font-medium" id="analysis-recommendation">Wir empfehlen eine sofortige rechtliche Prüfung der Fristen und eine schriftliche Dokumentation aller Mängel vor weiteren Schritten.</p>
                                <div class="flex flex-col sm:flex-row gap-4">
                                    <button id="to-lawyer-btn" class="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/40">
                                        <span>Passenden Anwalt finden</span>
                                        <i class="fas fa-arrow-right"></i>
                                    </button>
                                    <button onclick="window.print()" class="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-colors">
                                        <i class="fas fa-file-pdf"></i>
                                        <span>Bericht</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="mt-10 text-center">
                            <button onclick="goToStep(1)" class="text-slate-400 hover:text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 mx-auto transition-colors">
                                <i class="fas fa-chevron-left"></i>
                                <span>Zurück zur Übersicht</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STEP 3: Lawyer Search -->
            <div id="view-step-3" class="step-hidden fade-in">
                <div class="max-w-6xl mx-auto">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Experten-Matching</h2>
                        <p class="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">Finden Sie den am besten bewerteten Anwalt <br class="hidden md:block"> für Ihren spezifischen Fall.</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <!-- Search Form -->
                        <div class="lg:col-span-4">
                            <div class="glass-card p-10 rounded-[40px] shadow-xl sticky top-8 border-slate-200/50">
                                <h3 class="font-black text-slate-900 mb-8 flex items-center space-x-3 tracking-tight">
                                    <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <i class="fas fa-user-pen"></i>
                                    </div>
                                    <span class="text-xl">Ihre Daten</span>
                                </h3>
                                <div class="space-y-6">
                                    <div class="grid grid-cols-2 gap-6">
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Vorname</label>
                                            <input type="text" id="user-vorname" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nachname</label>
                                            <input type="text" id="user-nachname" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-6">
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">E-Mail Adresse</label>
                                            <input type="email" id="user-email" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium" placeholder="name@beispiel.de">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Telefonnummer</label>
                                            <input type="tel" id="user-phone" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium" placeholder="+49 ...">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Straße & Hausnummer</label>
                                        <input type="text" id="user-strasse" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium">
                                    </div>
                                    <div class="grid grid-cols-3 gap-6">
                                        <div class="col-span-1">
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">PLZ</label>
                                            <input type="text" id="user-plz" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner outline-none transition-premium">
                                        </div>
                                        <div class="col-span-2">
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Ort</label>
                                            <div class="relative">
                                                <input type="text" id="user-ort" class="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold shadow-inner pr-12 outline-none transition-premium">
                                                <i class="fas fa-location-dot absolute right-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="py-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                        <label class="flex items-center space-x-3 cursor-pointer mb-4 hover:translate-x-1 transition-transform">
                                            <div class="relative w-5 h-5">
                                                <input type="radio" name="search-scope" value="local" checked class="peer sr-only">
                                                <div class="w-full h-full bg-white border-2 border-slate-200 rounded-full peer-checked:border-blue-600 transition-all"></div>
                                                <div class="absolute inset-1 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                            </div>
                                            <span class="text-xs font-black text-slate-600 uppercase tracking-widest">Lokal suchen</span>
                                        </label>
                                        <label class="flex items-center space-x-3 cursor-pointer hover:translate-x-1 transition-transform">
                                            <div class="relative w-5 h-5">
                                                <input type="radio" name="search-scope" value="national" class="peer sr-only">
                                                <div class="w-full h-full bg-white border-2 border-slate-200 rounded-full peer-checked:border-blue-600 transition-all"></div>
                                                <div class="absolute inset-1 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                            </div>
                                            <span class="text-xs font-black text-slate-600 uppercase tracking-widest">Deutschlandweit</span>
                                        </label>
                                    </div>

                                    <button onclick="performExpertMatching()" class="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-premium flex items-center justify-center space-x-3">
                                        <i class="fas fa-bolt"></i>
                                        <span>Experten finden</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Results List -->
                        <div class="lg:col-span-8">
                            <div class="px-4 py-2 bg-slate-900 text-white inline-block rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-slate-900/20" id="lawyer-match-text">
                                System bereit für Matching...
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="lawyer-list">
                                <!-- Modern Placeholders -->
                                <div class="glass-card rounded-[35px] h-64 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group hover:border-blue-200 transition-all">
                                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-200 transition-colors">
                                        <i class="fas fa-user-tie text-3xl"></i>
                                    </div>
                                    <p class="text-xs font-black uppercase tracking-widest">Anwalt-Profil 1</p>
                                </div>
                                <div class="glass-card rounded-[35px] h-64 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group hover:border-blue-200 transition-all">
                                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-200 transition-colors">
                                        <i class="fas fa-user-tie text-3xl"></i>
                                    </div>
                                    <p class="text-xs font-black uppercase tracking-widest">Anwalt-Profil 2</p>
                                </div>
                            </div>

                            <div class="mt-12 glass-card p-10 rounded-[40px] border border-blue-100/50 flex flex-col sm:flex-row items-center sm:space-x-8 text-center sm:text-left relative overflow-hidden">
                                <div class="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
                                <div class="w-20 h-20 bg-white rounded-[25px] shadow-xl flex items-center justify-center mb-6 sm:mb-0 relative z-10">
                                    <i class="fas fa-shield-halved text-blue-600 text-3xl"></i>
                                </div>
                                <div class="relative z-10">
                                    <h4 class="text-xl font-black text-slate-900 tracking-tight mb-2">JurisMind Schutzgarantie</h4>
                                    <p class="text-slate-500 font-medium leading-relaxed">Ihre Daten werden nach Bankenstandard (AES-256) verschlüsselt übertragen. Eine Weitergabe erfolgt erst nach Ihrer expliziten Buchung.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STEP 4: Consultation Type Selection -->
            <div id="view-step-4" class="step-hidden fade-in">
                <div class="max-w-6xl mx-auto">
                    <!-- Lawyer Profile Header for Step 4 -->
                    <div class="glass-card p-10 rounded-[40px] shadow-2xl mb-12 flex flex-col md:flex-row items-center justify-between border-slate-200/50">
                        <div class="flex items-center space-x-8 mb-6 md:mb-0">
                            <div class="relative">
                                <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                                    <img id="step4-lawyer-img" src="" alt="Anwalt" class="w-full h-full object-cover">
                                </div>
                                <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                                    <i class="fas fa-check text-xs"></i>
                                </div>
                            </div>
                            <div>
                                <h2 class="text-3xl font-black text-slate-900 tracking-tight" id="step4-lawyer-name">Sabine Schulze</h2>
                                <p class="text-slate-500 font-bold text-xs" id="step4-lawyer-address"></p>
                                <p class="text-blue-600 font-black text-[10px] uppercase tracking-widest mt-1" id="step4-lawyer-title">Fachanwältin für Mietrecht</p>
                                <div class="flex items-center space-x-4 mt-3">
                                    <div class="flex items-center space-x-1 text-amber-500 font-black text-sm">
                                        <i class="fas fa-star"></i>
                                        <span id="step4-lawyer-rating">4.8</span>
                                    </div>
                                    <span class="text-slate-300">|</span>
                                    <span class="text-slate-500 text-xs font-bold uppercase tracking-widest" id="step4-lawyer-exp">12 Jahre Erfahrung</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status des Experten</p>
                            <div class="bg-green-100 text-green-700 text-[10px] font-black px-4 py-2 rounded-full inline-block uppercase tracking-widest shadow-sm">Jetzt verfügbar</div>
                        </div>
                    </div>

                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-black text-slate-900 mb-4 tracking-tight">Wie möchten Sie beraten werden?</h2>
                        <p class="text-slate-500 font-medium text-lg leading-relaxed">Wählen Sie das passende Beratungspaket für Ihre Bedürfnisse.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <!-- Phone -->
                        <div onclick="selectConsultation('Telefonische Beratung', 89)" class="glass-card p-10 rounded-[44px] border-2 border-transparent hover:border-blue-600 transition-premium cursor-pointer group flex flex-col items-center text-center shadow-xl hover:-translate-y-2 relative overflow-hidden bg-white/50">
                            <div class="w-20 h-20 bg-slate-50 text-blue-600 rounded-[30px] flex items-center justify-center text-3xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-premium shadow-inner">
                                <i class="fas fa-phone"></i>
                            </div>
                            <h3 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">Telefonat</h3>
                            <p class="text-slate-500 font-medium text-xs leading-relaxed mb-8 flex-1">Persönliches Telefongespräch zu Ihrem Termin.</p>
                            <div class="text-4xl font-black text-slate-900 mb-8 tracking-tighter">89<span class="text-lg">,00 €</span></div>
                            <button class="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-premium">Wählen</button>
                        </div>

                        <!-- Video -->
                        <div onclick="selectConsultation('Video-Beratung', 99)" class="glass-card p-10 rounded-[44px] border-2 border-blue-600/30 transition-premium cursor-pointer group flex flex-col items-center text-center shadow-2xl hover:-translate-y-2 relative overflow-hidden bg-white ring-8 ring-blue-600/5">
                            <div class="absolute top-6 right-6 bg-amber-400 text-slate-900 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg animate-bounce">Beliebt</div>
                            <div class="w-20 h-20 bg-blue-600 text-white rounded-[30px] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-premium shadow-xl shadow-blue-600/20">
                                <i class="fas fa-video"></i>
                            </div>
                            <h3 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">Video-Call</h3>
                            <p class="text-slate-500 font-medium text-xs leading-relaxed mb-8 flex-1">Face-to-Face Expertise bequem von Zuhause aus.</p>
                            <div class="text-4xl font-black text-blue-600 mb-8 tracking-tighter">99<span class="text-lg">,00 €</span></div>
                            <button class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-premium shadow-lg shadow-blue-600/20">Wählen</button>
                        </div>

                        <!-- Chat -->
                        <div onclick="selectConsultation('Chat-Beratung', 69)" class="glass-card p-10 rounded-[44px] border-2 border-transparent hover:border-blue-600 transition-premium cursor-pointer group flex flex-col items-center text-center shadow-xl hover:-translate-y-2 relative overflow-hidden bg-white/50">
                            <div class="w-20 h-20 bg-slate-50 text-blue-600 rounded-[30px] flex items-center justify-center text-3xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-premium shadow-inner">
                                <i class="fas fa-comments"></i>
                            </div>
                            <h3 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">V-Chat</h3>
                            <p class="text-slate-500 font-medium text-xs leading-relaxed mb-8 flex-1">Schnelle Klärung per Text-Chat in Echtzeit.</p>
                            <div class="text-4xl font-black text-slate-900 mb-8 tracking-tighter">69<span class="text-lg">,00 €</span></div>
                            <button class="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-premium">Wählen</button>
                        </div>
                    </div>
                    
                    <div class="mt-16 text-center">
                        <button onclick="goToStep(3)" class="text-slate-400 hover:text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 mx-auto transition-colors">
                            <i class="fas fa-chevron-left"></i>
                            <span>Zurück zur Expertensuche</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- STEP 5: Booking & Payment -->
            <div id="view-step-5" class="step-hidden fade-in">
                <div class="max-w-6xl mx-auto">
                    <!-- Lawyer Profile Header for Step 5 -->
                    <div class="glass-card p-8 rounded-[40px] shadow-2xl mb-12 flex flex-col md:flex-row items-center justify-between border-slate-200/50">
                        <div class="flex items-center space-x-6 mb-4 md:mb-0">
                            <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg">
                                <img id="step5-header-lawyer-img" src="" alt="Anwalt" class="w-full h-full object-cover">
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-slate-900 tracking-tight" id="step5-header-lawyer-name">-</h2>
                                <p class="text-slate-500 font-bold text-xs" id="step5-header-lawyer-address"></p>
                                <p class="text-blue-600 font-black text-[9px] uppercase tracking-widest mt-1" id="step5-header-lawyer-title">-</p>
                                <div class="flex items-center space-x-4 mt-2">
                                    <div class="flex items-center space-x-1 text-amber-500 font-black text-[10px]">
                                        <i class="fas fa-star"></i>
                                        <span id="step5-header-lawyer-rating">0.0</span>
                                    </div>
                                    <span class="text-slate-300 text-[10px]">|</span>
                                    <span class="text-slate-500 text-[10px] font-bold uppercase tracking-widest" id="step5-header-lawyer-exp">-</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-6">
                            <div class="text-center md:text-right">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gewählter Termin</p>
                                <div class="text-slate-900 font-bold text-sm" id="booking-time-display">Bitte wählen...</div>
                            </div>
                        </div>
                    </div>

                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-black text-slate-900 mb-4 tracking-tight">Termin konfigurieren</h2>
                        <p class="text-slate-500 font-medium text-lg leading-relaxed">Wählen Sie einen passenden Zeitraum für Ihre Fachberatung.</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <!-- Left: Calendar & Times -->
                        <div class="lg:col-span-8 space-y-10">
                            <div class="glass-card p-10 rounded-[40px] shadow-xl border-slate-200/50">
                                <h3 class="font-black text-xl text-slate-900 mb-8 flex items-center space-x-3 tracking-tight">
                                    <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <i class="fas fa-calendar-day"></i>
                                    </div>
                                    <span>Beratungskalender 2026</span>
                                </h3>
                                
                                <div class="grid grid-cols-7 gap-3 mb-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest" id="calendar-grid">
                                    <!-- Populated via JS -->
                                </div>

                                <div class="space-y-6">
                                    <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Verfügbare Uhrzeiten</h4>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <button onclick="selectTime(this)" class="time-slot p-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-inner">09:00</button>
                                        <button onclick="selectTime(this)" class="time-slot p-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-inner">10:30</button>
                                        <button onclick="selectTime(this)" class="time-slot p-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-inner">13:15</button>
                                        <button onclick="selectTime(this)" class="time-slot p-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-inner">15:00</button>
                                        <button onclick="selectTime(this)" class="time-slot p-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all shadow-inner">16:45</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Data Sync Section -->
                            <div class="glass-card p-10 rounded-[40px] shadow-xl border-slate-200/50">
                                <h3 class="font-black text-xl text-slate-900 mb-8 flex items-center space-x-3 tracking-tight">
                                    <div class="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                        <i class="fas fa-id-card"></i>
                                    </div>
                                    <span>Mandanten-Informationen</span>
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div class="space-y-2">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vollständiger Name</p>
                                        <p class="font-black text-slate-900 text-lg" id="display-user-name">-</p>
                                    </div>
                                    <div class="space-y-2">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anschrift</p>
                                        <p class="font-black text-slate-900 text-lg" id="display-user-address">-</p>
                                    </div>
                                    <div class="space-y-2">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefonnummer</p>
                                        <p class="font-black text-blue-600 text-lg" id="display-user-phone">-</p>
                                    </div>
                                    <div class="space-y-2">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Mail Kontakt</p>
                                        <p class="font-black text-blue-600 text-lg" id="display-user-email">-</p>
                                    </div>
                                </div>
                                <div class="mt-10 p-5 bg-slate-900 text-white rounded-[25px] flex items-center space-x-4 shadow-xl">
                                    <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                                        <i class="fas fa-shield-halved"></i>
                                    </div>
                                    <p class="text-xs font-medium text-slate-300">Diese sensiblen Daten werden erst nach erfolgreicher Buchung zur Fallbearbeitung an den Anwalt übertragen.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Summary -->
                        <div class="lg:col-span-4 space-y-8">
                            <div class="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl sticky top-8 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"></div>
                                <h3 class="font-black text-2xl mb-10 border-b border-white/10 pb-6 relative z-10 tracking-tight">Buchungs-Check</h3>
                                
                                <div class="flex items-center space-x-4 mb-10 p-5 bg-white/5 rounded-3xl border border-white/5 relative z-10">
                                    <div class="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shrink-0 shadow-lg">
                                        <img id="step5-lawyer-img" src="" alt="Anwalt" class="w-full h-full object-cover">
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-black text-sm text-white" id="step5-lawyer-name">-</p>
                                        <p class="text-[9px] font-bold text-slate-400" id="step5-lawyer-address-sidebar"></p>
                                        <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest" id="step5-lawyer-title">-</p>
                                    </div>
                                </div>

                                <div class="space-y-6 mb-12 relative z-10">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gewählte Leistung</span>
                                        <span class="font-black text-white text-right" id="summary-type">-</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Beratungsdauer</span>
                                        <span class="font-black text-white">30 Minuten</span>
                                    </div>
                                    <div class="pt-8 border-t border-white/10 flex justify-between items-center">
                                        <span class="text-slate-400 font-black uppercase tracking-widest text-xs">Gesamtbetrag</span>
                                        <span class="text-3xl font-black text-blue-400 tracking-tighter" id="summary-price">0,00 €</span>
                                    </div>
                                </div>

                                <button onclick="goToStep(6)" class="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black uppercase tracking-widest text-sm transition-premium shadow-2xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 relative z-10">
                                    Weiter zur Zahlung
                                </button>
                                
                                <div class="mt-8 text-center relative z-10">
                                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                                        Sicher & DSGVO konform <br> powered by JurisMind
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-12 text-center">
                        <button onclick="goToStep(4)" class="text-slate-400 hover:text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 mx-auto transition-colors">
                            <i class="fas fa-chevron-left"></i>
                            <span>Beratungsart ändern</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- STEP 6: Final Payment -->
            <div id="view-step-6" class="step-hidden fade-in">
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-black text-slate-900 mb-4 tracking-tight">Zahlungsprüfung</h2>
                        <p class="text-slate-500 font-medium text-lg leading-relaxed">Wählen Sie eine sichere Zahlungsmethode für Ihre Beratung.</p>
                    </div>

                    <div class="glass-card p-12 rounded-[50px] shadow-2xl max-w-2xl mx-auto border-slate-200/50">
                        <div class="bg-blue-900 text-white p-6 mb-10 rounded-[30px] flex items-center justify-between shadow-xl">
                            <div class="flex items-center space-x-4">
                                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 text-xl">
                                    <i class="fas fa-coins"></i>
                                </div>
                                <span class="font-black text-sm uppercase tracking-widest">Gesamtbetrag</span>
                            </div>
                            <span class="text-3xl font-black text-white tracking-tighter" id="final-price">0,00 €</span>
                        </div>

                        <div class="space-y-8">
                            <div>
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Zahlungsmethode wählen</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div onclick="selectPayment(this, 'PayPal')" class="payment-opt flex items-center space-x-5 p-6 bg-slate-50/50 rounded-3xl border-2 border-transparent cursor-pointer hover:border-blue-600 hover:bg-white transition-premium group shadow-sm">
                                        <div class="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-premium">
                                            <i class="fab fa-paypal text-blue-600 text-2xl"></i>
                                        </div>
                                        <span class="font-black text-slate-700 text-sm tracking-tight">PayPal</span>
                                    </div>
                                    <div onclick="selectPayment(this, 'Kreditkarte')" class="payment-opt flex items-center space-x-5 p-6 bg-slate-50/50 rounded-3xl border-2 border-transparent cursor-pointer hover:border-blue-600 hover:bg-white transition-premium group shadow-sm">
                                        <div class="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-premium">
                                            <i class="fas fa-credit-card text-slate-600 text-2xl"></i>
                                        </div>
                                        <span class="font-black text-slate-700 text-sm tracking-tight">Kreditkarte</span>
                                    </div>
                                    <div onclick="selectPayment(this, 'SEPA')" class="payment-opt flex items-center space-x-5 p-6 bg-slate-50/50 rounded-3xl border-2 border-transparent cursor-pointer hover:border-blue-600 hover:bg-white transition-premium group shadow-sm">
                                        <div class="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-premium">
                                            <i class="fas fa-university text-slate-600 text-2xl"></i>
                                        </div>
                                        <span class="font-black text-slate-700 text-sm tracking-tight">SEPA</span>
                                    </div>
                                    <div onclick="selectPayment(this, 'SOFORT')" class="payment-opt flex items-center space-x-5 p-6 bg-slate-50/50 rounded-3xl border-2 border-transparent cursor-pointer hover:border-blue-600 hover:bg-white transition-premium group shadow-sm">
                                        <div class="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-premium">
                                            <div class="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">SOFORT</div>
                                        </div>
                                        <span class="font-black text-slate-700 text-sm tracking-tight">Überweisung</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Formular für Kreditkarte -->
                            <div id="cc-form" class="hidden space-y-6 bg-slate-50/80 p-8 rounded-[35px] border-2 border-slate-100/50 shadow-inner scale-up">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kartennummer</label>
                                    <input type="text" class="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-blue-600 focus:outline-none" placeholder="xxxx xxxx xxxx xxxx">
                                </div>
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gültig bis</label>
                                        <input type="text" class="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-blue-600 focus:outline-none" placeholder="MM/JJ">
                                    </div>
                                    <div>
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">CVV</label>
                                        <input type="text" class="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-blue-600 focus:outline-none" placeholder="123">
                                    </div>
                                </div>
                            </div>

                            <!-- Formular für SEPA -->
                            <div id="sepa-form" class="hidden space-y-6 bg-slate-50/80 p-8 rounded-[35px] border-2 border-slate-100/50 shadow-inner scale-up">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">IBAN</label>
                                    <input type="text" class="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-blue-600 focus:outline-none" placeholder="DE12 3456 ...">
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kontoinhaber</label>
                                    <input type="text" class="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-blue-600 focus:outline-none" placeholder="Max Mustermann">
                                </div>
                            </div>
                        </div>

                        <button onclick="confirmBooking()" class="w-full mt-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs transition-premium shadow-2xl shadow-blue-900/40 flex items-center justify-center space-x-4 hover:-translate-y-1 active:scale-95">
                            <i class="fas fa-shield-check"></i>
                            <span>Zahlungspflichtig buchen</span>
                        </button>
                        
                        <div class="mt-8 flex justify-center items-center space-x-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                            <i class="fab fa-cc-visa text-3xl"></i>
                            <i class="fab fa-cc-mastercard text-3xl"></i>
                            <i class="fab fa-apple-pay text-4xl"></i>
                            <i class="fab fa-google-pay text-4xl"></i>
                        </div>
                    </div>

                    <div class="mt-12 text-center">
                        <button onclick="goToStep(5)" class="text-slate-400 hover:text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 mx-auto transition-colors">
                            <i class="fas fa-chevron-left"></i>
                            <span>Zusammenfassung ansehen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentSelectedTopic = '';
            let paypalAuthorized = false;
            let currentPaymentMethod = '';
            let conversationHistory = []; // Needed for persistence simulation
            let lastAnalysisData = null;
            let lastTopic = '';

            const TOPICS_CONFIG = [
                { id: 'Kündigung', label: 'Kündigungsschutz', icon: 'fa-gavel', color: '#1976d2' },
                { id: 'Mietminderung', label: 'Mietminderung', icon: 'fa-house-crack', color: '#2e7d32' },
                { id: 'Nebenkosten', label: 'Nebenkosten', icon: 'fa-receipt', color: '#d32f2f' },
                { id: 'Kaution', label: 'Kaution', icon: 'fa-vault', color: '#ed6c02' },
                { id: 'Mietvertrag', label: 'Mietvertrag', icon: 'fa-file-lines', color: '#9c27b0' },
                { id: 'Renovierung', label: 'Renovierung', icon: 'fa-paint-roller', color: '#0288d1' },
                { id: 'Mieterhöhung', label: 'Mieterhöhung', icon: 'fa-chart-line', color: '#c62828' },
                { id: 'Hausordnung', label: 'Hausordnung', icon: 'fa-list-check', color: '#388e3c' },
                { id: 'Lärm', label: 'Lärm', icon: 'fa-volume-high', color: '#1976d2' }
            ];

            const LAWYERS_DATA = [
                { id: 1, name: 'Dr. Hans-Werner Meyer', title: 'Fachanwalt für Miet- & WEG-Recht', exp: '18 Jahre', rating: '4.9', reviews: 142, focus: ['Kaution', 'Kündigung', 'Renovierung'], location: 'Berlin', address: 'Friedrichstraße 12, 10117 Berlin', img: '/static/images/lawyer_meyer.png' },
                { id: 2, name: 'Sabine Schulze', title: 'Rechtsanwältin für Immobilienrecht', exp: '12 Jahre', rating: '4.8', reviews: 98, focus: ['Mietminderung', 'Nebenkosten', 'Wohnfläche'], location: 'Hamburg', address: 'Neuer Wall 34, 20354 Hamburg', img: '/static/images/lawyer_schulze.png' },
                { id: 3, name: 'Markus Weber', title: 'Fachanwalt für Wohnungsrecht', exp: '15 Jahre', rating: '5.0', reviews: 210, focus: ['Lärm', 'Tierhaltung', 'Hausordnung', 'Kündigung'], location: 'München', address: 'Maximilianstraße 1, 80539 München', img: '/static/images/lawyer_weber.png' },
                { id: 4, name: 'Elena Petrova', title: 'Expertin für gewerbliches Mietrecht', exp: '10 Jahre', rating: '4.7', reviews: 76, focus: ['Mietvertrag', 'Modernisierung', 'Wasserschaden'], location: 'Köln', address: 'Schildergasse 8, 50667 Köln', img: '/static/images/lawyer_petrova.png' },
                { id: 5, name: 'Christian Wagner', title: 'Fachanwalt für Bau- & Architektenrecht', exp: '22 Jahre', rating: '4.9', reviews: 185, focus: ['Modernisierung', 'Mängel', 'Renovierung'], location: 'Frankfurt', address: 'Zeil 100, 60313 Frankfurt', img: '/static/images/lawyer_wagner.png' },
                { id: 6, name: 'Julia Hoffmann', title: 'Rechtsanwältin für Mietrecht', exp: '8 Jahre', rating: '4.6', reviews: 54, focus: ['Kaution', 'Hausordnung', 'Tierhaltung'], location: 'Stuttgart', address: 'Königstraße 2, 70173 Stuttgart', img: '/static/images/lawyer_hoffmann.png' },
                { id: 7, name: 'Thomas Müller', title: 'Fachanwalt für Erbrecht & Immobilien', exp: '25 Jahre', rating: '5.0', reviews: 312, focus: ['Mietvertrag', 'Wohnrecht', 'Räumung'], location: 'Düsseldorf', address: 'Königsallee 10, 40212 Düsseldorf', img: 'https://ui-avatars.com/api/?name=Thomas+Mueller&background=0288d1&color=fff' },
                { id: 8, name: 'Andreas Bauer', title: 'Spezialist für Mieterschutz', exp: '14 Jahre', rating: '4.8', reviews: 126, focus: ['Mietminderung', 'Nebenkosten', 'Kündigung'], location: 'Leipzig', address: 'Grimmaische Str. 1, 04109 Leipzig', img: 'https://ui-avatars.com/api/?name=Andreas+Bauer&background=2e7d32&color=fff' },
                { id: 9, name: 'Melanie Schmidt', title: 'Rechtsanwältin für privates Mietrecht', exp: '11 Jahre', rating: '4.7', reviews: 89, focus: ['Lärm', 'Tierhaltung', 'Wohnfläche'], location: 'Bremen', address: 'Sögestraße 5, 28195 Bremen', img: 'https://ui-avatars.com/api/?name=Melanie+Schmidt&background=7b1fa2&color=fff' },
                { id: 10, name: 'Stefan Klein', title: 'Experte für Immobilienverwaltung', exp: '9 Jahre', rating: '4.5', reviews: 42, focus: ['Nebenkosten', 'Modernisierung', 'Kaution'], location: 'Hannover', address: 'Georgstraße 1, 30159 Hannover', img: 'https://ui-avatars.com/api/?name=Stefan+Klein&background=ed6c02&color=fff' }
            ];

            const grid = document.getElementById('topics-grid');
            TOPICS_CONFIG.forEach(topic => {
                const card = document.createElement('div');
                card.className = 'topic-card glass-card p-6 rounded-3xl border border-transparent hover:border-blue-200 cursor-pointer text-center transition-premium group bg-white';
                card.onclick = () => loadTopic(topic.id);
                card.innerHTML = `
                    <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-premium" style="color: ${topic.color}">
                        <i class="fas ${topic.icon} text-2xl group-hover:scale-110 transition-premium"></i>
                    </div>
                    <span class="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">${topic.label}</span>
                `;
                grid.appendChild(card);
            });

            document.getElementById('current-date').innerText = new Date().toLocaleDateString('de-DE');

            async function loadTopic(id) {
                currentSelectedTopic = id;
                lastTopic = id;
                const results = document.getElementById('results-content');
                results.innerHTML = '<div class="animate-pulse flex flex-col items-center py-6"><div class="w-8 h-8 bg-blue-100 rounded-full mb-2"></div><div class="h-2 w-24 bg-blue-100 rounded"></div></div>';
                
                try {
                    const res = await fetch(`/api/topic/${id}`);
                    const data = await res.json();
                    lastAnalysisData = data;
                    displayResults(id, data);
                } catch (err) {
                    results.innerHTML = '<p class="text-red-500">Fehler beim Laden.</p>';
                }
            }

            function displayResults(topic, data) {
                const results = document.getElementById('results-content');
                
                // Be flexible with keys (Gemini/OpenAI might return variations)
                let kiText = data['KI-Einschätzung'] || data['KI-Einschaetzung'] || data['ki_evaluation'] || data['summary'] || data['ki_assessment'] || data['result'];
                
                // Show error if data contains one
                if (data.error) {
                    kiText = `Fehler: ${data.error}`;
                }

                if (!kiText) {
                    kiText = 'Eine Analyse wird vorbereitet. Bitte wechseln Sie zur professionellen Analyse für Details.';
                }

                let html = `<div class="w-full text-left p-4 scale-up">
                    <div class="mb-6 p-6 bg-blue-50/50 rounded-[30px] border-l-8 border-blue-500 shadow-inner">
                        <p class="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3">KI-Einschätzung (Schritt 1)</p>
                        <p class="text-base leading-relaxed text-slate-700 font-medium italic">"${kiText}"</p>
                    </div>
                    <button onclick="prepareAndGoToAnalysis('${topic.replace(/'/g, "\\'")}')" class="w-full py-5 bg-slate-900 text-white rounded-[25px] text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center space-x-3 hover:scale-[1.02] active:scale-95">
                        <span>Professionelle Fachanalyse</span>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <p class="text-[9px] text-slate-400 text-center mt-4 font-black uppercase tracking-widest">Klicken Sie für BGB-Referenzen & Urteile</p>
                </div>`;
                results.innerHTML = html;
            }

            function prepareAndGoToAnalysis(topic, dataInput) {
                const data = dataInput || lastAnalysisData;
                const grid = document.getElementById('analysis-grid');
                grid.innerHTML = '';
                
                // 1. Professionelle Analyse (Prominent)
                if (data['Professionelle Analyse']) {
                    const item = document.createElement('div');
                    item.className = 'col-span-full bg-blue-50/30 p-8 rounded-[35px] border border-blue-100 shadow-inner mb-2';
                    item.innerHTML = `
                        <p class="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">Rechtliche Fachanalyse (§§ BGB)</p>
                        <p class="text-xl leading-relaxed text-slate-800 font-bold">${data['Professionelle Analyse']}</p>
                    `;
                    grid.appendChild(item);
                }

                // 2. Gerichtsurteile (Dark Style)
                if (data['Gerichtsurteile']) {
                    const item = document.createElement('div');
                    item.className = 'col-span-full bg-slate-900 text-white p-8 rounded-[35px] shadow-2xl mb-6 relative overflow-hidden';
                    item.innerHTML = `
                        <div class="absolute top-0 right-0 p-6 opacity-10">
                            <i class="fas fa-gavel text-6xl"></i>
                        </div>
                        <div class="flex items-center space-x-3 mb-4 relative z-10">
                            <div class="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-slate-900 text-xs">
                                <i class="fas fa-balance-scale"></i>
                            </div>
                            <p class="text-[10px] font-black uppercase text-amber-400 tracking-widest">Wichtige Gerichtsurteile</p>
                        </div>
                        <p class="text-sm leading-relaxed text-slate-300 font-medium relative z-10">${data['Gerichtsurteile']}</p>
                    `;
                    grid.appendChild(item);
                }

                // 3. Andere Felder (Fallback)
                for (const key in data) {
                    if (['KI-Einschätzung', 'Professionelle Analyse', 'Gerichtsurteile'].includes(key)) continue;
                    const item = document.createElement('div');
                    item.className = 'bg-slate-50 p-6 rounded-2xl border border-slate-100';
                    item.innerHTML = `
                        <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">${key}</p>
                        <p class="text-sm leading-relaxed text-slate-700 font-medium">${data[key]}</p>
                    `;
                    grid.appendChild(item);
                }
                
                document.getElementById('analysis-title').innerText = `Professionelle Analyse: ${topic}`;
                
                // Professional Risk & Recommendation Engine
                const analysisProfiles = {
                    'Kaution': {
                        risk: 'Unnötige Verzögerungen bei der Rückzahlung führen zu Zinsverlusten. Bei Einbehalt ohne Grund droht ein Rechtsstreit. Achten Sie auf die 6-Monats-Frist.',
                        rec: 'Setzen Sie dem Vermieter schriftlich eine 14-tägige Frist zur Abrechnung/Rückzahlung. Fordern Sie ggf. Verzugszinsen nach BGB.'
                    },
                    'Kündigung': {
                        risk: 'Höchstes Risiko bei Formfehlern (Schriftform!) und Fristberechnung. Eine unwirksame Kündigung kann monatelange Mietfortzahlungen bedeuten.',
                        rec: 'Prüfen Sie unbedingt die Zustellung (Einschreiben). Lassen Sie die Begründung (z.B. Eigenbedarf) rechtlich auf Wirksamkeit prüfen.'
                    },
                    'Mietminderung': {
                        risk: 'Risiko der fristlosen Kündigung durch den Vermieter, falls die Minderung zu hoch angesetzt wird (Zahlungsverzug von > 1 Monat).',
                        rec: 'Zahlen Sie die Miete nur unter Vorbehalt. Nutzen Sie eine anerkannte Mietminderungstabelle und dokumentieren Sie Mängel mit Fotos/Zeugen.'
                    },
                    'Nebenkosten': {
                        risk: 'Verwirkung von Einwendungsrechten nach 12 Monaten nach Erhalt der Abrechnung. Hohes Risiko durch unzulässige Umlageschlüssel.',
                        rec: 'Fordern Sie Belegeinsicht an. Vergleichen Sie die Kosten mit dem Vorjahr und dem regionalen Betriebskostenspiegel.'
                    },
                    'Mietvertrag': {
                        risk: 'Hohes Risiko bei unwirksamen Renovierungsklauseln. Mieter renovieren oft unnötig. Prüfen Sie die Fristenpläne und Endrenovierungspflichten gemäß aktueller BGH-Rechtsprechung.',
                        rec: 'Lassen Sie Ihren Mietvertrag auf "starre Fristen" prüfen. Dokumentieren Sie den Zustand bei Einzug (unrenoviert übergeben?).'
                    },
                    'Untervermietung': {
                        risk: 'Abmahngefahr bei unerlaubter Untervermietung (§ 540 BGB). Fristlose Kündigung möglich, wenn die Erlaubnis vorsätzlich nicht eingeholt wurde.',
                        rec: 'Prüfen Sie Ihr "berechtigtes Interesse" gemäß § 553 BGB. Stellen Sie eine schriftliche Anfrage an den Vermieter mit Details zum Untermieter.'
                    },
                    'Eigentümerwechsel': {
                        risk: 'Unsicherheit bezüglich der Kautionsrückzahlung (§ 566a BGB) und möglicher Eigenbedarfskündigungen durch den neuen Eigentümer.',
                        rec: 'Prüfen Sie den Grundbucheintrag. Stellen Sie sicher, dass die Miete erst nach formeller Mitteilung an den neuen Eigentümer gezahlt wird.'
                    },
                    'Wohnungsübergabe': {
                        risk: 'Streit um Schönheitsreparaturen und Kautionseinbehalt wegen (angeblicher) Schäden. Verjährungsfrist von 6 Monaten (§ 548 BGB) beachten.',
                        rec: 'Bestehen Sie auf ein gemeinsames Übergabeprotokoll mit Fotos. Nehmen Sie Zeugen zur Übergabe mit.'
                    },
                    'Renovierung': {
                        risk: 'Kostenrisiko von mehreren tausend Euro bei Durchführung nicht geschuldeter Arbeiten oder Schadensersatz bei unterlassener wirksamer Renovierung.',
                        rec: 'Prüfen Sie, ob die Renovierungsklausel starr ist (unwirksam). Führen Sie beim Auszug ein Übergabeprotokoll mit dem Vermieter.'
                    },
                    'Mieterhöhung': {
                        risk: 'Kostenrisiko bei unberechtigter Mieterhöhung. Bei Widerspruch droht Klage. Bei Zustimmung zu hoher Miete über Jahre hinweg.',
                        rec: 'Prüfen Sie die Form und Begründung der Mieterhöhung. Vergleichen Sie mit dem Mietspiegel. Widersprechen Sie fristgerecht.'
                    },
                    'Hausordnung': {
                        risk: 'Abmahngefahr und Kündigungsrisiko bei wiederholten Verstößen gegen Ruhezeiten oder Reinigungspflichten.',
                        rec: 'Dokumentieren Sie ggf. Gegenbeweise bei ungerechtfertigten Vorwürfen. Suchen Sie das Gespräch mit der Hausverwaltung.'
                    },
                    'Lärm': {
                        risk: 'Beweisnotstand bei fehlender Dokumentation. Risiko der Eskalation mit Nachbarn ohne rechtliche Grundlage.',
                        rec: 'Führen Sie ein exaktes Lärmprotokoll über mindestens 2 Wochen. Informieren Sie den Vermieter schriftlich über die Beeinträchtigung.'
                    },
                    'Modernisierung': {
                        risk: 'Erhebliche dauerhafte Mieterhöhung (8% der Kosten). Risiko durch unzureichende Ankündigung oder fehlende Härtefallprüfung.',
                        rec: 'Prüfen Sie die Ankündigungsfrist (3 Monate). Machen Sie ggf. wirtschaftliche Härtegründe innerhalb der Frist geltend.'
                    },
                    'Tierhaltung': {
                        risk: 'Rechtsstreit um die Entfernung des Tieres bei fehlender oder verweigerter Zustimmung trotz berechtigtem Interesse.',
                        rec: 'Holen Sie die Zustimmung schriftlich ein. Ein generelles Verbot im Vertrag ist meist unwirksam, eine Einzelfallprüfung ist Pflicht.'
                    },
                    'Wohnfläche': {
                        risk: 'Überzahlung von Miete und Nebenkosten über Jahre hinweg bei falscher Flächenangabe im Mietvertrag.',
                        rec: 'Messen Sie nach (Wohnflächenverordnung). Bei >10% Abweichung fordern Sie Rückzahlung und Anpassung für die Zukunft.'
                    },
                    'Wasserschaden': {
                        risk: 'Haftungsrisiko für Folgeschäden (Schimmel, Substanzschäden) bei verspäteter Schadensmeldung durch den Mieter.',
                        rec: 'Melden Sie den Schaden sofort (Telefon + E-Mail). Fordern Sie Trocknungsgeräte an und mindern Sie die Miete für die Dauer der Arbeiten.'
                    },
                    'Vermieterfragen': {
                        risk: 'Diskriminierungsgefahr und Verletzung der Privatsphäre. Unzulässige Fragen im Bewerbungsprozess können Schadensersatzansprüche nach dem AGG auslösen.',
                        rec: 'Antworten Sie auf unzulässige Fragen (z.B. Familienplanung) zurückhaltend oder nutzen Sie Ihr Recht zur Lüge. Lassen Sie sich bei Diskriminierung rechtlich beraten.'
                    }
                };

                const profile = analysisProfiles[topic] || {
                    risk: 'Es besteht ein allgemeines rechtliches Risiko. Handeln Sie nicht ohne Klärung der Sachlage.',
                    rec: 'Wir empfehlen eine detaillierte Prüfung durch einen spezialisierten Anwalt, um Ihre Rechte zu wahren.'
                };

                document.getElementById('analysis-risk').innerText = profile.risk;
                document.getElementById('analysis-recommendation').innerText = profile.rec;
                
                document.getElementById('to-lawyer-btn').onclick = () => renderLawyers(topic);

                goToStep(2);
            }

            function renderLawyers(topic) {
                // Just transition to Step 3, matching happens via form
                document.getElementById('lawyer-match-text').innerText = `Experten-Matching für "${topic}" vorbereitet...`;
                goToStep(3);
            }

            function performExpertMatching() {
                const list = document.getElementById('lawyer-list');
                const vorname = document.getElementById('user-vorname');
                const nachname = document.getElementById('user-nachname');
                const email = document.getElementById('user-email');
                const phone = document.getElementById('user-phone');
                const plz = document.getElementById('user-plz');
                const ort = document.getElementById('user-ort');
                const scope = document.querySelector('input[name="search-scope"]:checked').value;
                const matchBtn = document.querySelector('button[onclick="performExpertMatching()"]');

                // Reset errors
                [vorname, nachname, email, phone, plz, ort].forEach(el => el.classList.remove('input-error'));
                matchBtn.classList.remove('shake');

                let isValid = true;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const plzRegex = /^\d{5}$/;

                if (!vorname.value.trim()) { vorname.classList.add('input-error'); isValid = false; }
                if (!nachname.value.trim()) { nachname.classList.add('input-error'); isValid = false; }
                if (!emailRegex.test(email.value.trim())) { email.classList.add('input-error'); isValid = false; }
                if (!phone.value.trim()) { phone.classList.add('input-error'); isValid = false; }
                if (!plzRegex.test(plz.value.trim())) { plz.classList.add('input-error'); isValid = false; }
                if (!ort.value.trim()) { ort.classList.add('input-error'); isValid = false; }

                if (!isValid) {
                    matchBtn.classList.add('shake');
                    // Add a temporary error text below the button if not present
                    return;
                }

                list.innerHTML = '<div class="col-span-full py-12 text-center animate-pulse text-blue-500 font-bold italic">Suche Experten in Ihrer Region...</div>';
                
                setTimeout(() => {
                    list.innerHTML = '';
                    let matches = [];
                    
                    if(scope === 'local') {
                        // Simulate local search (showing lawyers from same "region" or top matches)
                        matches = LAWYERS_DATA.filter(l => l.focus.includes(currentSelectedTopic) || l.rating >= 4.8);
                    } else {
                        // National - Show all specialized or top-rated (now showing up to 10)
                        matches = [...LAWYERS_DATA].sort((a,b) => b.rating - a.rating);
                    }

                    matches.slice(0, 10).forEach(lawyer => {
                        const card = document.createElement('div');
                        card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col scale-in';
                        
                        // Fake distance if local
                        const distance = scope === 'local' ? `${(Math.random() * 5 + 1).toFixed(1)} km entfernt` : lawyer.location;

                        card.innerHTML = `
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0">
                                    <img src="${lawyer.img}" alt="${lawyer.name}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name)}&background=random'">
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 leading-tight text-sm">${lawyer.name}</h4>
                                    <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wide">${lawyer.title}</p>
                                </div>
                            </div>
                            <div class="space-y-3 mb-6 flex-1">
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-400">Erfahrung</span>
                                    <span class="font-bold">${lawyer.exp}</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-400">Bewertung</span>
                                    <span class="text-yellow-500 font-bold"><i class="fas fa-star mr-1"></i>${lawyer.rating}</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-400">Standort</span>
                                    <span class="font-bold text-blue-600">${distance}</span>
                                </div>
                            </div>
                            <button onclick="contactLawyer('${lawyer.name}')" class="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                                Jetzt kontaktieren
                            </button>
                        `;
                        list.appendChild(card);
                    });

                    document.getElementById('lawyer-match-text').innerText = `${matches.length} passende Experten in ${ort || 'Ihrer Region'} für "${currentSelectedTopic}" gefunden`;
                }, 1500);
            }

            let selectedConsultationType = '';
            let currentPrice = 0;
            let currentLawyer = null;

            function contactLawyer(name) {
                // Find lawyer in data
                currentLawyer = LAWYERS_DATA.find(l => l.name === name);
                if(!currentLawyer) return;

                // Sync to Step 4 UI
                document.getElementById('step4-lawyer-name').innerText = currentLawyer.name;
                document.getElementById('step4-lawyer-img').src = currentLawyer.img;
                document.getElementById('step4-lawyer-title').innerText = currentLawyer.title;
                document.getElementById('step4-lawyer-rating').innerText = currentLawyer.rating;
                document.getElementById('step4-lawyer-exp').innerText = `${currentLawyer.exp} Erfahrung`;
                document.getElementById('step4-lawyer-address').innerText = currentLawyer.address;

                goToStep(4);
            }

            function selectPayment(el) {
                const method = el.querySelector('span').innerText.trim();
                console.log('Payment method selected:', method);
                
                document.querySelectorAll('.payment-opt').forEach(opt => opt.classList.remove('border-blue-500', 'bg-blue-50'));
                el.classList.add('border-blue-500', 'bg-blue-50');
                
                // Reset Forms
                document.getElementById('cc-form').classList.add('hidden');
                document.getElementById('sepa-form').classList.add('hidden');
                
                currentPaymentMethod = method;
                
                const methodLower = method.toLowerCase();
                if (methodLower.includes('paypal')) {
                    showLoading('Verbindung zu PayPal wird hergestellt...');
                    setTimeout(() => {
                        hideLoading();
                        openPaypalModal();
                    }, 1200);
                } else if (methodLower.includes('überweisung') || methodLower.includes('sofort')) {
                    showLoading('SOFORT wird vorbereitet...');
                    setTimeout(() => {
                        hideLoading();
                        openSofortModal();
                    }, 1000);
                } else if (methodLower.includes('kreditkarte')) {
                    document.getElementById('cc-form').classList.remove('hidden');
                } else if (methodLower.includes('sepa')) {
                    document.getElementById('sepa-form').classList.remove('hidden');
                }
            }

            function openPaypalModal() {
                document.getElementById('paypal-modal-backdrop').style.display = 'block';
                document.getElementById('paypal-modal').style.display = 'block';
                document.getElementById('paypal-login-view').classList.remove('hidden');
                document.getElementById('paypal-checkout-view').classList.add('hidden');
                document.getElementById('paypal-email').focus();
            }

            function closePaypalModal() {
                document.getElementById('paypal-modal-backdrop').style.display = 'none';
                document.getElementById('paypal-modal').style.display = 'none';
            }

            function handlePaypalLogin() {
                const email = document.getElementById('paypal-email').value;
                if (!email || !email.includes('@')) {
                    alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                    return;
                }
                
                showLoading('Konto wird verifiziert...');
                
                setTimeout(() => {
                    hideLoading();
                    // Transition to Yellow Checkout Page
                    document.getElementById('paypal-login-view').classList.add('hidden');
                    document.getElementById('paypal-checkout-view').classList.remove('hidden');
                    document.getElementById('paypal-checkout-amount').innerText = currentPrice.toFixed(2) + ' €';
                }, 1500);
            }

            function finalizePaypalPayment() {
                closePaypalModal();
                showLoading('Zahlung wird autorisiert...');
                
                setTimeout(() => {
                    hideLoading();
                    paypalAuthorized = true;
                    // Visual feedback on the booking button
                    const btn = document.querySelector('button[onclick="confirmBooking()"]');
                    btn.innerHTML = '<i class="fas fa-check"></i> <span>Zahlung autorisiert - Jetzt buchen</span>';
                    btn.classList.remove('bg-blue-600');
                    btn.classList.add('bg-green-600');
                }, 2000);
            }

            function openSofortModal() {
                document.getElementById('sofort-modal-backdrop').style.display = 'block';
                document.getElementById('sofort-modal').style.display = 'block';
                document.getElementById('sofort-price').innerText = currentPrice.toFixed(2) + ' €';
            }

            function closeSofortModal() {
                document.getElementById('sofort-modal-backdrop').style.display = 'none';
                document.getElementById('sofort-modal').style.display = 'none';
            }

            function handleSofortRedirect() {
                closeSofortModal();
                showLoading('Weiterleitung zu Ihrer Bank...');
                
                setTimeout(() => {
                    showLoading('Warten auf Bank-Autorisierung...');
                    setTimeout(() => {
                        hideLoading();
                        paypalAuthorized = true; // Use same flag
                        const btn = document.querySelector('button[onclick="confirmBooking()"]');
                        btn.innerHTML = '<i class="fas fa-check"></i> <span>Zahlung autorisiert - Jetzt buchen</span>';
                        btn.classList.remove('bg-blue-600');
                        btn.classList.add('bg-green-600');
                        alert('Zahlung erfolgreich über SOFORT autorisiert.');
                    }, 2000);
                }, 1500);
            }

            function showLoading(text) {
                document.getElementById('loading-text').innerText = text;
                document.getElementById('loading-overlay').style.display = 'flex';
            }

            function hideLoading() {
                document.getElementById('loading-overlay').style.display = 'none';
            }

            function selectConsultation(type, price) {
                selectedConsultationType = type;
                currentPrice = price;
                document.getElementById('summary-type').innerText = type;
                document.getElementById('summary-price').innerText = price.toFixed(2) + ' €';
                document.getElementById('final-price').innerText = price.toFixed(2) + ' €';
                
                // Sync Lawyer to Step 5
                if(currentLawyer) {
                    document.getElementById('step5-header-lawyer-name').innerText = currentLawyer.name;
                    document.getElementById('step5-header-lawyer-img').src = currentLawyer.img;
                    document.getElementById('step5-header-lawyer-title').innerText = currentLawyer.title;
                    document.getElementById('step5-header-lawyer-rating').innerText = currentLawyer.rating;
                    document.getElementById('step5-header-lawyer-exp').innerText = `${currentLawyer.exp} Erfahrung`;
                    document.getElementById('step5-header-lawyer-address').innerText = currentLawyer.address;
                    
                    document.getElementById('step5-lawyer-name').innerText = currentLawyer.name;
                    document.getElementById('step5-lawyer-img').src = currentLawyer.img;
                    document.getElementById('step5-lawyer-title').innerText = currentLawyer.title;
                    document.getElementById('step5-lawyer-address-sidebar').innerText = currentLawyer.address;
                }

                // Sync data from Step 3
                const vorname = document.getElementById('user-vorname').value || '';
                const nachname = document.getElementById('user-nachname').value || '';
                const strasse = document.getElementById('user-strasse').value || '';
                const plz = document.getElementById('user-plz').value || '';
                const ort = document.getElementById('user-ort').value || '';
                const phone = document.getElementById('user-phone').value || '';
                const email = document.getElementById('user-email').value || '';

                document.getElementById('display-user-name').innerText = `${vorname} ${nachname}`.trim() || 'Nicht angegeben';
                document.getElementById('display-user-address').innerText = strasse ? `${strasse}, ${plz} ${ort}` : 'Nicht angegeben';
                document.getElementById('display-user-phone').innerText = phone || 'Nicht angegeben';
                document.getElementById('display-user-email').innerText = email || 'Nicht angegeben';

                renderCalendar();
                goToStep(5);
            }

            function renderCalendar() {
                const grid = document.getElementById('calendar-grid');
                grid.innerHTML = '<span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>';
                
                const today = new Date();
                const holidays = ["1.1."]; // Mock holiday list
                
                // Add padding for correct day alignment (Mo=1, Di=2 ... So=0)
                // Need (today.getDay() + 6) % 7 empty slots
                const padding = (today.getDay() + 6) % 7;
                for(let p=0; p<padding; p++) {
                    const span = document.createElement('span');
                    grid.appendChild(span);
                }

                for(let i=0; i<14; i++) {
                    const d = new Date();
                    d.setDate(today.getDate() + i);
                    const dayNum = d.getDate();
                    const monthNum = d.getMonth() + 1;
                    const dateStr = dayNum + '.' + monthNum + '.';
                    
                    const fullDateStr = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
                    const isoDateStr = d.toISOString().split('T')[0];
                    
                    const isSunday = d.getDay() === 0;
                    const isSaturday = d.getDay() === 6;
                    const isHoliday = holidays.includes(dateStr);
                    const isInactive = isSunday || isHoliday;
                    
                    const btn = document.createElement('button');
                    btn.innerText = dayNum;
                    btn.setAttribute('data-full-date', fullDateStr);
                    btn.setAttribute('data-iso-date', isoDateStr);
                    
                    if (isInactive) btn.disabled = true;
                    
                    const updateStyles = (active) => {
                        let classes = "p-4 rounded-2xl border transition-premium text-sm font-black ";
                        if (isInactive) {
                            classes += "bg-slate-50 text-slate-200 border-slate-50 cursor-not-allowed opacity-30";
                        } else if (active) {
                            classes += "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105";
                        } else if (isSaturday) {
                            classes += "bg-white text-blue-600 border-blue-100 hover:border-blue-400";
                        } else {
                            classes += "bg-white hover:border-blue-400 border-slate-100 text-slate-600 shadow-sm";
                        }
                        btn.className = classes;
                    };

                    updateStyles(i === 0);
                    if (isInactive) btn.disabled = true;

                    btn.onclick = () => {
                        if (isInactive) return;
                        document.querySelectorAll('#calendar-grid button').forEach(b => {
                            if (b.btnRedraw) b.btnRedraw(false);
                        });
                        updateStyles(true);
                    };
                    
                    btn.btnRedraw = (active) => updateStyles(active);
                    grid.appendChild(btn);
                }
            }

            function selectTime(btn) {
                const time = btn.innerText.trim();
                console.log('Time selected:', time);
                
                // Reset all slots
                document.querySelectorAll('.time-slot').forEach(b => {
                    b.classList.remove('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-500/30', 'border-blue-600', 'scale-105');
                    b.classList.add('bg-slate-50/50', 'text-slate-700', 'border-transparent');
                });
                
                // Set active slot
                btn.classList.remove('bg-slate-50/50', 'text-slate-700', 'border-transparent');
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-xl', 'shadow-blue-500/30', 'border-blue-600', 'scale-105');
                
                // Update display
                const selectedDayBtn = document.querySelector('#calendar-grid button.bg-blue-600');
                const fullDate = selectedDayBtn?.getAttribute('data-full-date') || '-';
                const bookingDisplay = document.getElementById('booking-time-display');
                if (bookingDisplay) {
                    bookingDisplay.innerText = `${fullDate} um ${time} Uhr`;
                    bookingDisplay.setAttribute('data-iso-date', selectedDayBtn?.getAttribute('data-iso-date'));
                    bookingDisplay.setAttribute('data-time', time);
                }
            }

            async function confirmBooking() {
                if (!currentPaymentMethod) {
                    alert('Bitte wählen Sie eine Zahlungsmethode.');
                    return;
                }

                if (currentPaymentMethod === 'PayPal' && !paypalAuthorized) {
                    openPaypalModal();
                    return;
                }

                showLoading(currentPaymentMethod === 'PayPal' ? 'Zahlung wird abgeschlossen...' : `Weiterleitung zu ${currentPaymentMethod}...`);
                
                // Prepare Case Data for Lawyer Dashboard
                const bookingData = {
                    timestamp: new Date().toISOString(),
                    userName: document.getElementById('user-vorname').value + ' ' + document.getElementById('user-nachname').value,
                    userEmail: document.getElementById('user-email').value,
                    userPhone: document.getElementById('user-phone').value,
                    userAddress: document.getElementById('user-strasse').value + ', ' + document.getElementById('user-plz').value + ' ' + document.getElementById('user-ort').value,
                    topic: lastTopic,
                    analysis: lastAnalysisData['Professionelle Analyse'],
                    risk: document.getElementById('analysis-risk').innerText,
                    recommendation: document.getElementById('analysis-recommendation').innerText,
                    lawyer: currentLawyer?.name,
                    consultationType: selectedConsultationType,
                    price: currentPrice,
                    bookingTime: document.getElementById('booking-time-display').innerText
                };

                try {
                    const response = await fetch('/api/book', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bookingData)
                    });
                    const result = await response.json();
                    console.log('Booking saved:', result);
                } catch (err) {
                    console.error('Error saving booking:', err);
                }

                setTimeout(() => {
                    hideLoading();
                    const results = document.getElementById('view-step-6');
                    results.innerHTML = `
                    <div class="max-w-3xl mx-auto text-center py-12 fade-in">
                        <div class="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-8 shadow-premium floating border border-green-100">
                            <i class="fas fa-check"></i>
                        </div>
                        <h2 class="text-5xl font-black text-slate-900 mb-4 tracking-tight">Termin bestätigt!</h2>
                        <p class="text-slate-500 mb-10 text-lg font-medium">Vielen Dank für Ihr Vertrauen. <br>Ihre Beratung wurde erfolgreich reserviert.</p>
                        
                        <div class="flex items-center justify-center space-x-4 mb-10 p-6 glass-card border-green-100 shadow-sm border-left-4 border-l-green-500">
                            <div class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                                <i class="fas fa-envelope-circle-check text-xl"></i>
                            </div>
                            <div class="text-left">
                                <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">E-Mail Bestätigung</p>
                                <p class="text-sm font-black text-slate-700">Gesendet an <span class="text-blue-600">${bookingData.userEmail}</span></p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div class="glass-card p-10 border-2 border-dashed border-slate-200 group hover:border-blue-500 transition-premium flex flex-col justify-between bg-white/50">
                                <div class="flex items-center justify-between mb-8">
                                    <div class="text-left">
                                        <p class="text-[10px] font-black uppercase text-blue-600 tracking-widest">Bereit zum Download</p>
                                        <h4 class="font-bold text-slate-900">Analyse_${lastTopic.replace(/\s+/g, '_')}.txt</h4>
                                    </div>
                                    <i class="fas fa-file-alt text-4xl text-blue-500"></i>
                                </div>
                                <button onclick="generateLegalDocument()" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center space-x-3">
                                    <i class="fas fa-download"></i>
                                    <span>Download</span>
                                </button>
                            </div>

                            <div class="bg-amber-50 p-8 rounded-[35px] border-2 border-dashed border-amber-200 group hover:border-amber-400 transition-all flex flex-col justify-between">
                                <div class="flex items-center justify-between mb-6">
                                    <div class="text-left">
                                        <p class="text-[10px] font-black uppercase text-amber-600 tracking-widest">Kalender Export</p>
                                        <h4 class="font-bold text-slate-900">Termin.ics</h4>
                                    </div>
                                    <i class="fas fa-calendar-check text-4xl text-amber-500"></i>
                                </div>
                                <button onclick="downloadICS()" class="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center space-x-3">
                                    <i class="fas fa-calendar-plus"></i>
                                    <span>Exportieren</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-col space-y-4">
                            <button onclick="location.reload()" class="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">
                                Zurück zum Dashboard
                            </button>
                            <a href="/lawyer" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-widest">
                                <i class="fas fa-external-link-alt mr-1"></i> Anwalts-Dashboard öffnen
                            </a>
                        </div>
                    </div>
                `;
                    const progress = document.getElementById('progress-bar');
                    progress.style.width = '100%';
                    document.getElementById('progress-text').innerText = '100%';
                }, 2000);
            }

            function generateLegalDocument() {
                const vorname = document.getElementById('user-vorname').value || 'Max';
                const nachname = document.getElementById('user-nachname').value || 'Mustermann';
                const date = new Date().toLocaleDateString('de-DE');
                
                const content = `
JURISMIND SMARTLAW AGENT - RECHTSSICHERES DOKUMENT
Datum: ${date}
Mandant: ${vorname} ${nachname}
Thema: ${lastTopic}

GEGENSTAND DER ANALYSE:
------------------------
${lastAnalysisData['Professionelle Analyse'] || 'Individuelle Fallprüfung'}

RECHTLICHE BEURTEILUNG:
------------------------
${lastAnalysisData['KI-Einschätzung'] || ''}

RECHTSPRECHUNG:
------------------------
${lastAnalysisData['Gerichtsurteile'] || 'Es gelten die allgemeinen BGH-Grundsätze.'}

HINWEIS:
Dieses Dokument wurde automatisiert erstellt und dient der Vorbereitung Ihres Anwaltstermins.
JurisMind GmbH - Ihr Partner für digitales Mietrecht.
                `;
                
                const blob = new Blob([content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeTopic = lastTopic.replace(/\s+/g, '_');
                a.download = `JurisMind_Analyse_${safeTopic}.txt`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                alert('Ihr Dokument wurde generiert und heruntergeladen.');
            }

            function downloadICS() {
                const bookingDisplay = document.getElementById('booking-time-display');
                const isoDate = bookingDisplay?.getAttribute('data-iso-date'); // YYYY-MM-DD
                const time = bookingDisplay?.getAttribute('data-time'); // HH:MM
                
                if (!isoDate || !time) {
                    alert('Fehler beim Generieren des Kalendereintrags.');
                    return;
                }

                const startDateTime = isoDate.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
                
                // End time 30 mins later
                const [hh, mm] = time.split(':').map(Number);
                const endDate = new Date(isoDate);
                endDate.setHours(hh);
                endDate.setMinutes(mm + 30);
                const endDateTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                // Wait, toISOString is UTC, isoDate is local... let's keep it simple for mock
                const simpleEnd = isoDate.replace(/-/g, '') + 'T' + (mm >= 30 ? (hh+1).toString().padStart(2,'0') : hh.toString().padStart(2,'0')) + (mm >= 30 ? (mm-30).toString().padStart(2,'0') : (mm+30).toString().padStart(2,'0')) + '00';

                const lawyerName = currentLawyer?.name || 'Rechtsanwalt';
                const lawyerAddress = currentLawyer?.address || '';
                const summary = `Erstberatung: ${lastTopic} - JurisMind`;
                const description = `Ihr gebuchter Termin bei ${lawyerName}.\\\\nThema: ${lastTopic}\\\\nAnschrift: ${lawyerAddress}`;

                const icsContent = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'PRODID:-//JurisMind//SmartLaw Agent//DE',
                    'BEGIN:VEVENT',
                    `DTSTART:${simpleEnd.startsWith('T') ? startDateTime : isoDate.replace(/-/g, '') + 'T' + time.replace(':', '') + '00'}`,
                    `DTEND:${simpleEnd}`,
                    `SUMMARY:${summary}`,
                    `DESCRIPTION:${description}`,
                    `LOCATION:${lawyerAddress}`,
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\\n');

                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'JurisMind_Termin.ics';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }

            function goToStep(num) {
                const steps = [
                    document.getElementById('view-step-1'),
                    document.getElementById('view-step-2'),
                    document.getElementById('view-step-3'),
                    document.getElementById('view-step-4'),
                    document.getElementById('view-step-5'),
                    document.getElementById('view-step-6')
                ];
                const progress = document.getElementById('progress-bar');
                const progText = document.getElementById('progress-text');
                const stepInfo = document.getElementById('step-info');

                // Reset
                steps.forEach(el => el && el.classList.add('step-hidden'));
                
                const configs = {
                    1: { width: '17%', info: 'Schritt 1 von 6 • 17%' },
                    2: { width: '34%', info: 'Schritt 2 von 6 • 34%' },
                    3: { width: '51%', info: 'Schritt 3 von 6 • 51%' },
                    4: { width: '68%', info: 'Schritt 4 von 6 • 68%' },
                    5: { width: '85%', info: 'Schritt 5 von 6 • 85%' },
                    6: { width: '95%', info: 'Schritt 6 von 6 • 95%' }
                };

                if(steps[num-1]) {
                    steps[num-1].classList.remove('step-hidden');
                    progress.style.width = configs[num].width;
                    progText.innerText = configs[num].width;
                    stepInfo.innerText = configs[num].info;
                    setStepper(num);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            function setStepper(num) {
                const steppers = [
                    document.getElementById('stepper-1'),
                    document.getElementById('stepper-2'),
                    document.getElementById('stepper-3'),
                    document.getElementById('stepper-4'),
                    document.getElementById('stepper-5'),
                    document.getElementById('stepper-6')
                ];
                
                steppers.forEach(el => {
                    if(!el) return;
                    el.classList.add('opacity-50');
                    el.classList.remove('stepper-active');
                });
                
                for(let i=0; i<num; i++) {
                    if(steppers[i]) {
                        steppers[i].classList.remove('opacity-50');
                        if(i === num-1) steppers[i].classList.add('stepper-active');
                    }
                }
            }

            async function askQuestion() {
                const q = document.getElementById('question').value;
                if(!q) return;
                
                const results = document.getElementById('results-content');
                results.innerHTML = '<p class="animate-pulse">Analysiere Fragestellung...</p>';
                
                const qLower = q.toLowerCase();
                const topics = TOPICS_CONFIG.map(t => t.id);
                let found = topics.find(t => qLower.includes(t.toLowerCase()));
                
                // Erweitere Suche für Aliase
                if (!found) {
                    if (qLower.includes('miete erhöhen') || qLower.includes('mieterhöhung')) found = 'Mieterhöhung';
                    else if (qLower.includes('nebenkosten') || qLower.includes('betriebskosten')) found = 'Nebenkosten';
                    else if (qLower.includes('mietminderung') || qLower.includes('mängel') || (qLower.includes('miete') && qLower.includes('minder'))) found = 'Mietminderung';
                    else if (qLower.includes('schönheitsreparaturen') || qLower.includes('renovierung') || qLower.includes('streichen')) found = 'Renovierung';
                    else if (qLower.includes('untermieter') || qLower.includes('untervermietung') || qLower.includes('untervermieten')) found = 'Untervermietung';
                    else if (qLower.includes('hausverkauf') || qLower.includes('neuer eigentümer') || qLower.includes('eigentümerwechsel') || qLower.includes('verkauft')) found = 'Eigentümerwechsel';
                    else if (qLower.includes('übergabe') || qLower.includes('wohnungsübergabe') || qLower.includes('auszug') || qLower.includes('einzug')) found = 'Wohnungsübergabe';
                    else if (qLower.includes('vertrag') || qLower.includes('abkommen')) found = 'Mietvertrag';
                    else if (qLower.includes('unwirksam') || qLower.includes('ungültig') || qLower.includes('klausel')) found = 'Unwirksame Klauseln';
                    else if (qLower.includes('reparatur') || qLower.includes('kleinreparatur')) found = 'Kleinreparaturen';
                    else if (qLower.includes('verzich') || qLower.includes('kündigungsausschluss')) found = 'Kündigungsverzicht';
                    else if (qLower.includes('pauschal')) found = 'Pauschalen';
                    else if (qLower.includes('schlüssel') || qLower.includes('zutritt') || qLower.includes('betreten')) found = 'Wohnungsschlüssel';
                    else if (qLower.includes('wie hoch') || qLower.includes('mietpreis') || qLower.includes('miethöhe') || qLower.includes('bremse')) found = 'Mietpreis';
                    else if (qLower.includes('frage') || qLower.includes('selbstauskunft') || qLower.includes('wissen') || qLower.includes('auskunft')) found = 'Vermieterfragen';
                    else if (qLower.includes('kündigung') || qLower.includes('kündigen')) found = 'Kündigung';
                    else if (qLower.includes('kaution') || qLower.includes('sicherheit')) found = 'Kaution';
                    // Check for E-Bike specific (mapped to Mängel/Mietminderung if no direct topic)
                    else if (qLower.includes('e-bike') || qLower.includes('laden')) {
                        // We forcedly let it fall through to /api/analyze-custom for specific AI analysis
                        found = null; 
                    }
                }

                if(found) {
                    console.log('Matching topic found:', found);
                    loadTopic(found);
                } else {
                    console.log('No matching topic, calling custom AI analysis...');
                    results.innerHTML = '<div class="flex flex-col items-center py-6 scale-in"><div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Live KI-Analyse wird generiert...</p></div>';
                    
                    try {
                        const response = await fetch('/api/analyze-custom', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ question: q })
                        });
                        
                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.error || 'Server Fehler');
                        }

                        const data = await response.json();
                        console.log('AI Analysis Result:', data);
                        lastAnalysisData = data;
                        lastTopic = 'Spezifische Analyse';
                        setTimeout(() => {
                            displayResults('Spezifische Analyse', data);
                        }, 500);
                    } catch (err) {
                        console.error('AI Analysis Error:', err);
                        results.innerHTML = `<div class="p-6 bg-red-50 rounded-2xl border border-red-100"><p class="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Analyse-Fehler</p><p class="text-sm text-red-500">${err.message || 'Die KI ist aktuell nicht erreichbar.'}</p></div>`;
                    }
                }
            }

            function quickAction(action) {
                const results = document.getElementById('results-content');
                results.scrollIntoView({ behavior: 'smooth', block: 'center' });
                loadTopic(action);
            }

            async function handleFileUpload(input) {
                const file = input.files[0];
                if (!file) return;

                const results = document.getElementById('results-content');
                results.innerHTML = `
                    <div class="flex flex-col items-center py-6 scale-in">
                        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p class="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Dokument wird digitalisiert...</p>
                        <p class="text-[10px] text-slate-400 mt-2 font-bold">${file.name}</p>
                    </div>
                `;

                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64Data = e.target.result.split(',')[1];
                    const mimeType = file.type;

                    try {
                        const response = await fetch('/api/analyze-document', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                file_content: base64Data,
                                mime_type: mimeType,
                                file_name: file.name
                            })
                        });

                        if (!response.ok) throw new Error('Analyse fehlgeschlagen');

                        const data = await response.json();
                        lastAnalysisData = data;
                        lastTopic = 'Dokumenten-Analyse';
                        displayResults('Dokumenten-Analyse', data);

                    } catch (err) {
                        results.innerHTML = `<div class="p-6 bg-red-50 rounded-2xl border border-red-100"><p class="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">OCR-Fehler</p><p class="text-sm text-red-500">${err.message}</p></div>`;
                    }
                };
                reader.readAsDataURL(file);
            }

            // Initialize app
            goToStep(1);
        </script>
    </body>
    </html>
    '''

@app.route("/api/topics")
def get_topics():
    return jsonify(list(MIETRECHT_WISSEN.keys()))

@app.route("/api/topic/<topic_name>")
def get_topic(topic_name):
    for key in MIETRECHT_WISSEN:
        if key.lower() == topic_name.lower():
            return jsonify(MIETRECHT_WISSEN[key])
    return jsonify({"error": "Thema nicht gefunden"}), 404

@app.route("/api/analyze-custom", methods=["POST"])
def analyze_custom():
    data = request.json
    question = data.get("question", "")
    
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
             return jsonify(response)

        is_serious = any(kw in q_lower for kw in ["anwalt", "gericht", "klage", "frist", "kündigung"])
        response = {
            "KI-Einschätzung": f"Vielen Dank für Ihre spezifische Frage: '{question}'. Als KI-Assistent analysiere ich diesen Fall individuell. Es scheint um eine rechtliche Detailfrage zu gehen. Grundsätzlich ist im Mietrecht wichtig, alle Vereinbarungen schriftlich festzuhalten. Bei Schikanen oder unklaren Forderungen sollten Sie keine vorschnellen Zusagen machen.",
            "Professionelle Analyse": f"Individuelle Fallprüfung basierend auf Ihrer Eingabe. Da es sich um einen spezifischen Sachverhalt handelt, müssen §§ 242 BGB (Treu und Glauben) sowie die individuellen Vertragsklauseln geprüft werden. { 'Hohes Risikopotenzial erkannt.' if is_serious else 'Mäßiges rechtliches Risiko.' } Wir empfehlen die Prüfung der Beweislage (Korrespondenz, Fotos, Zeugen).",
            "Gerichtsurteile": "BGH VIII ZR 189/17 (Allgemeine Grundsätze zur Interessenabwägung); BGH VIII ZR 107/13 (Anforderungen an die Transparenz von Forderungen).",
            "Dokument-Typ": "Individuelle Stellungnahme"
        }
        return jsonify(response)

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
    
    Wichtige Regeln:
    1. Sei präzise und nenne konkrete Paragraphen (z.B. § 535, § 536 BGB).
    2. Unterscheide klar zwischen Mieter- und Vermieterrechten.
    3. Weise auf Fristen und Formvorschriften hin.
    4. Bleibe objektiv und professionell.
    5. Wenn Informationen fehlen, weise darauf hin.
    """

    try:
        if openai_key:
            # Use OpenAI (Primary if key exists)
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analysiere folgenden Fall eines Nutzers:\n'{question}'"}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            import json
            raw_content = response.choices[0].message.content
            print(f"OpenAI Response: {raw_content}")
            return jsonify(json.loads(raw_content))
            
        elif google_key:
            # Use Gemini
            full_prompt = f"{system_prompt}\n\nAnalysiere folgenden Fall eines Nutzers:\n'{question}'"
            response = gemini_model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            import json
            return jsonify(json.loads(response.text))
        
    except Exception as e:
        error_msg = str(e)
        print(f"AI Error: {error_msg}")
        return jsonify({"error": f"KI-Analyse fehlgeschlagen: {error_msg}"}), 500

@app.route("/api/analyze-document", methods=["POST"])
def analyze_document():
    data = request.json
    file_content = data.get("file_content")
    mime_type = data.get("mime_type")
    
    if not file_content:
        return jsonify({"error": "Keine Datei hochgeladen"}), 400

    if not gemini_model:
        return jsonify({"error": "Gemini API nicht konfiguriert"}), 500

    prompt = """
    Du bist ein KI-Rechtsassistent für Mietrecht. Analysiere das hochgeladene Dokument (z.B. Mietvertrag, Kündigung, Nebenkostenabrechnung).
    Extrahiere die wichtigsten Informationen und identifiziere potenzielle rechtliche Probleme oder unwirksame Klauseln.
    
    Antworte IMMER im folgenden JSON-Format:
    {
        "KI-Einschätzung": "Eine kurze, verständliche Zusammenfassung des Dokuments.",
        "Professionelle Analyse": "Detaillierte juristische Analyse mit Bezug auf BGB-Paragraphen.",
        "Gerichtsurteile": "Zitierung relevanter Rechtsprechung passend zum Dokument.",
        "Dokument-Typ": "Art des Dokuments (z.B. Wohnraummietvertrag)"
    }
    """

    try:
        # Construct content for Gemini
        # For images/PDFs, we pass the bytes
        doc_part = {
            "mime_type": mime_type,
            "data": file_content
        }
        
        response = gemini_model.generate_content(
            [prompt, doc_part],
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        
        return jsonify(json.loads(response.text))
    except Exception as e:
        print(f"OCR Error: {e}")
        return jsonify({"error": f"Dokumenten-Analyse fehlgeschlagen: {str(e)}"}), 500

@app.route("/health")
def health():
    return jsonify({"status": "online", "topics": len(MIETRECHT_WISSEN)})

@app.route("/api/book", methods=["POST"])
def book_consultation():
    data = request.json
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        # Get next ID
        cursor.execute("SELECT COUNT(*) FROM cases")
        count = cursor.fetchone()[0]
        case_identifier = f"JM-{count + 1001}"
        
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
        ''', (case_identifier, data.get("timestamp"), user_data, case_data, booking_data, "Neu"))
        conn.commit()
        
    return jsonify({"status": "success", "case_id": case_identifier})

@app.route("/api/cases")
def get_cases():
    cases = []
    with sqlite3.connect(DB_PATH) as conn:
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
    return jsonify(cases)

@app.route("/lawyer")
def lawyer_dashboard():
    return '''
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JurisMind Lawyer Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; background: #f8fafc; }
            .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        </style>
    </head>
    <body class="p-8">
        <div class="max-w-7xl mx-auto">
            <header class="flex justify-between items-center mb-12">
                <div>
                    <h1 class="text-3xl font-black text-slate-900">Lawyer <span class="text-blue-600">Dashboard</span></h1>
                    <p class="text-slate-500 font-medium">Willkommen zurück, Kanzlei JurisMind.</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <p class="text-sm font-bold text-slate-900">Dr. Sabine Schulze</p>
                        <p class="text-[10px] text-blue-600 font-black uppercase tracking-widest">Partner</p>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-lg">SS</div>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="glass-card p-6 rounded-3xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Neue Fälle</p>
                    <h3 class="text-3xl font-black text-slate-900" id="stat-new">0</h3>
                </div>
                <div class="glass-card p-6 rounded-3xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">In Bearbeitung</p>
                    <h3 class="text-3xl font-black text-slate-900">0</h3>
                </div>
                <div class="glass-card p-6 rounded-3xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Umsatz Heute</p>
                    <h3 class="text-3xl font-black text-blue-600">0,00 €</h3>
                </div>
            </div>

            <div class="glass-card rounded-[40px] overflow-hidden">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h2 class="text-xl font-black text-slate-900">Aktuelle Mandatsanfragen</h2>
                    <button onclick="loadCases()" class="p-2 text-blue-600 hover:rotate-180 transition-transform duration-500"><i class="fas fa-sync-alt"></i></button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th class="p-6">ID</th>
                                <th class="p-6">Mandant / Thema</th>
                                <th class="p-6">Beratung</th>
                                <th class="p-6">Zeitpunkt</th>
                                <th class="p-6">Status</th>
                                <th class="p-6">Aktion</th>
                            </tr>
                        </thead>
                        <tbody id="case-table-body">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            async function loadCases() {
                const res = await fetch('/api/cases');
                const cases = await res.json();
                const body = document.getElementById('case-table-body');
                const statNew = document.getElementById('stat-new');
                
                statNew.innerText = cases.length;
                body.innerHTML = '';
                
                cases.reverse().forEach(c => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer';
                    row.innerHTML = `
                        <td class="p-6 font-black text-slate-400 text-xs">${c.id}</td>
                        <td class="p-6">
                            <p class="font-bold text-slate-900">${c.user.name}</p>
                            <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider">${c.case.topic}</p>
                        </td>
                        <td class="p-6">
                            <p class="text-sm font-bold text-slate-700">${c.booking.type}</p>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${c.booking.price} €</p>
                        </td>
                        <td class="p-6">
                            <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">${c.booking.time}</span>
                        </td>
                        <td class="p-6">
                            <span class="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-widest">${c.status}</span>
                        </td>
                        <td class="p-6">
                            <button onclick="alert('Fall-Details:\\\\nTopic: ' + '${c.case.topic}' + '\\\\nAnalyse: ' + '${c.case.analysis?.substring(0, 100)}...')" class="w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    `;
                    body.appendChild(row);
                });
            }
            loadCases();
            setInterval(loadCases, 10000);
        </script>
    </body>
    </html>
    '''

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)