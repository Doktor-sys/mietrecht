from flask import Flask, jsonify 
app = Flask(__name__) 
 
@app.route("/") 
def home(): 
    return "MIETRECHT APP - EINFACHE VERSION" 
 
if __name__ == "__main__": 
    app.run(host="0.0.0.0", port=5000) 
