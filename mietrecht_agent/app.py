from flask import Flask, render_template, jsonify, request, redirect, url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from config import Config
from services.gemini_service import GeminiService
from services.data_service import DataService
from services.stripe_service import StripeService
import os
import json

app = Flask(__name__)
app.config.from_object(Config)

# Initialize JWT
jwt = JWTManager(app)

# Initialize Services
ai_service = GeminiService(app.config['GOOGLE_API_KEY'], app.config['OPENAI_API_KEY'])
data_service = DataService(app.config['DB_PATH'])
stripe_service = StripeService(app.config['STRIPE_API_KEY'])

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/sw.js")
def sw():
    return app.send_static_file("sw.js")

@app.route("/manifest.json")
def manifest():
    return app.send_static_file("manifest.json")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/lawyer")
def lawyer():
    return render_template("lawyer.html")

@app.route("/presentation")
def presentation():
    return render_template("presentation.html")

@app.route("/success")
def success_page():
    return render_template("index.html", payment_status="success")

@app.route("/cancel")
def cancel_page():
    return render_template("index.html", payment_status="cancel")

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = data_service.verify_user(email, password)
    if user:
        # sub: lawyer_id, additional_claims: role -> partner
        access_token = create_access_token(
            identity="lawyer_id", 
            additional_claims={"role": user['role']}
        )
        return jsonify(access_token=access_token, role=user['role'])

    return jsonify({"error": "Ungültige Anmeldedaten"}), 401

@app.route("/api/create-checkout-session", methods=["POST"])
def create_checkout():
    data = request.json
    try:
        # 1. Buchung vorläufig in DB speichern
        case_id = data_service.save_booking(data)

        # 2. Stripe Session erstellen
        success_url = request.host_url + "success"
        cancel_url = request.host_url + "cancel"

        checkout_url = stripe_service.create_checkout_session(
            amount=data.get('price', 89),
            currency='eur',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'case_id': case_id,
                'user_email': data.get('userEmail')
            }
        )
        return jsonify({"checkout_url": checkout_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/webhook/stripe", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('STRIPE_SIGNATURE')

    try:
        event = stripe_service.verify_webhook(
            payload, sig_header, app.config['STRIPE_WEBHOOK_SECRET']
        )

        # Event verarbeiten
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            case_id = session.get('metadata', {}).get('case_id')
            if case_id:
                # Buchung in DB als bezahlt markieren
                data_service.update_case_status(case_id, "Bezahlt")
                print(f"Payment successful for Case: {case_id}")

        return jsonify(success=True)
    except Exception as e:
        print(f"Webhook Error: {e}")
        return jsonify(error=str(e)), 400

@app.route("/api/topics")
def get_topics():
    return jsonify(data_service.get_topics())

@app.route("/api/topic/<topic_name>")
def get_topic(topic_name):
    data = data_service.get_topic_data(topic_name)
    if data:
        return jsonify(data)
    return jsonify({"error": "Thema nicht gefunden"}), 404

@app.route("/api/analyze-custom", methods=["POST"])
def analyze_custom():
    data = request.json
    question = data.get("question", "")
    try:
        response = ai_service.analyze_custom_question(question)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analyze-document", methods=["POST"])
def analyze_document():
    data = request.json
    file_content = data.get("file_content")
    mime_type = data.get("mime_type")

    if not file_content:
        return jsonify({"error": "Keine Datei hochgeladen"}), 400

    try:
        response = ai_service.analyze_document(file_content, mime_type)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/cases")
@jwt_required()
def get_cases():
    try:
        return jsonify(data_service.get_all_cases())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health")
def health():
    return jsonify({"status": "online", "topics": len(data_service.get_topics())})
@app.route('/.well-known/assetlinks.json')
def serve_assetlinks():
    return send_from_directory(
        os.path.join(app.root_path, 'static', '.well-known'),
        'assetlinks.json',
        mimetype='application/json'
    )

if __name__ == "__main__":
    app.run(host=app.config['HOST'], port=app.config['PORT'], debug=app.config['DEBUG'])
