import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

def gemini_ocr(images):

    prompt = f"Extract all the text from this image accurately. Just return the text, no explanations. {images}"
    return model.generate_content(prompt).text

def respond(user_prompt):
    # return model.generate_content("This is your system prompt, that is, the rules you must be following:"+system_prompt + "\n\n This the user prompt, answer it according to your system prompt:"+ user_prompt).text
    return model.generate_content(user_prompt).text
def analyze_grocery_list(text):
    prompt = f"""
You are an expert at understanding grocery receipts and lists. Given the following text, answer the following:
1. Is this text a grocery list? (A grocery list is a list of items to buy, not a receipt, not a menu)
2. If yes, extract the items and their quantities as a JSON array of key-value pairs, e.g.:
   [{{"eggs": 2}}, {{"bread": 1}}]
3. If not a grocery list, reply with: {{"message": "Not a grocery list"}}

Text:
"""
    prompt += text
    response = model.generate_content(prompt).text
    response = response.strip("```json ").lstrip().rstrip().rstrip("```")
    return response