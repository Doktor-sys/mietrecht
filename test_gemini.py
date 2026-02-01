import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.environ.get("GOOGLE_API_KEY")
print(f"Using Key: {key[:10]}...")

try:
    genai.configure(api_key=key)
    # Testing with a very simple model name
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content("Say hello in German")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"FAILED: {str(e)}")
