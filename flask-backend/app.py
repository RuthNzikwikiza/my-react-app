from flask import Flask, request, jsonify
import openrouter
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
openrouter.api_key = os.getenv("OPENROUTER_API_KEY")

app = Flask(__name__)
CORS(app) 
@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    prompt = data.get("text", "")

    try:
        response = openrouter.ChatCompletion.create(
            model="gpt-3.5-turbo",  
            messages=[
                {"role": "system", "content": "You are a helpful summarizer."},
                {"role": "user", "content": f"Summarize this: {prompt}"}
            ]
        )
        result = response.choices[0].message.content.strip()
        return jsonify({"summary": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
