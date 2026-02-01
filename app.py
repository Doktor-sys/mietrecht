from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Mietrecht App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 40px;
                background-color: #f0f0f0;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            h1 {
                color: green;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✅ Mietrecht-App läuft erfolgreich!</h1>
            <p>Docker-Container mit Flask ist in Betrieb.</p>
            <p>Port: 5000 (Container) -> 7000 (Host)</p>
            <p><strong>Status:</strong> Alles funktioniert korrekt.</p>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)