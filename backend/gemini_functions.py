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
You are an expert at understanding grocery receipts and lists. You are having a conversation with a user to finalize their grocery list. Here is how the conversation should go:

1. When the user provides a text, determine if it is a grocery list (a list of items to buy, not a receipt, not a menu).
2. If it is a grocery list, extract the items and their quantities.
3. Present the extracted list to the user in a normal, friendly form (not JSON) strictly, and ask: "Is this your final list or do you want to update it? Allow user to update the list"
4. If the user provides an updated list, repeat the extraction and ask again if it's final or needs updating.
5. If the user replies 'final', return the list in JSON form only, with no extra text.
6. If the text is not a grocery list, reply with: {"message": "Not a grocery list"}

Text:
"""
    prompt += text
    response = model.generate_content(prompt).text
    response = response.strip("```json ").lstrip().rstrip().rstrip("```")
    return response