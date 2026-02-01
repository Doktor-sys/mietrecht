import os

class Config:
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    DB_PATH = os.path.join(os.path.dirname(__file__), "mietrecht.db")
    DEBUG = True
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jurismind-super-secret-key")
    STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_51...your_test_key...") # Placeholder for user
    STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "whsec_...")
    PORT = 5000
    HOST = "0.0.0.0"
