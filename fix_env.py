import os

content = """GOOGLE_API_KEY=AIzaSyAePXjZAYOx584ZeGUbtoJJ9mtJtL0azVc
OPENAI_API_KEY=
"""

with open('.env', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed .env encoding to UTF-8")
