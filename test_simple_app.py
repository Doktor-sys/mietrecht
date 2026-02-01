#!/usr/bin/env python3
"""
Simple test Flask app to verify deployment works
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "<h1>SmartLaw Agent Test</h1><p>Server is working!</p>"

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "message": "Test app is running"})

@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    return jsonify({"status": "success", "message": "Test API endpoint working"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)