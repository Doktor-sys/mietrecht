from flask import Flask, jsonify 
app = Flask(__name__) 
 
MIETRECHT = { 
    '"kündigung"': {'"frist"': '"3 Monate"', '"form"': '"schriftlich"'}, 
    '"mietminderung"': {'"voraussetzung"': '"erheblicher Mangel"'}, 
    '"kaution"': {'"höhe"': '"max. 3 Nettokaltmieten"'} 
} 
 
@app.route("/") 
def home(): 
    html = '"<html><body style=\"padding: 40px; font-family: Arial;\">"' 
    html += '"<h1>✅ JurisMind Mietrecht</h1>"' 
    html += '"<p>Produktionsversion - Docker Deployment erfolgreich!</p>"' 
    for topic in MIETRECHT: 
        html += '"<p><a href=\"/api/"' + topic + '"\">' + topic + '</a></p>"' 
    html += '"</body></html>"' 
    return html 
 
@app.route("/api/<topic>") 
def api(topic): 
    if topic in MIETRECHT: 
        return jsonify(MIETRECHT[topic]) 
    return jsonify({'"error"': '"Nicht gefunden"'}), 404 
 
if __name__ == "__main__": 
    print("Produktions-App startet auf Port 5000...") 
    app.run(host='"0.0.0.0"', port=5000) 
