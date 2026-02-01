from flask import Flask 
app = Flask("test2") 
@app.route("/") 
def hello(): return "HELLO" 
if __name__ == "__main__": app.run(host="0.0.0.0") 
