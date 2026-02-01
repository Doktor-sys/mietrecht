from flask import Flask 
app = Flask("test") 
@app.route("/") 
def hello(): return "TEST OK" 
if __name__ == "__main__": app.run(host="0.0.0.0") 
