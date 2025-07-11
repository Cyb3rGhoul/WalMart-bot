import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
import re

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

def extract_general_product_names(products_json):
    """
    Extract general product names from a JSON containing product information.
    
    Args:
        products_json (str or dict): JSON string or dictionary containing product data
        
    Returns:
        dict: JSON with general product names
    """
    # Convert to string if it's a dict
    if isinstance(products_json, dict):
        products_json = json.dumps(products_json)
    
    prompt = f"""
    You are a product name extractor. Given a JSON containing product information, 
    extract only the general product names (not brand names).
    
    Examples:
    - "Amool milk" → "milk"
    - "Cowdairy cheese" → "cheese"
    - "Nestle yogurt" → "yogurt"
    - "Kraft cheddar cheese" → "cheese"
    - "Organic whole milk" → "milk"
    
    Input JSON: {products_json}
    
    Return ONLY a valid JSON object with the general product names and quantity. 
    If the input contains a list of products, return a list of general names.
    If the input contains product objects, preserve the structure but replace product names with general names.
    
    Do not include any explanations, just return the JSON.
    """
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    print("Gemini response:", text)

    # Remove Markdown code block if present
    if text.startswith("```"):
        # Remove the first line (```json or ```)
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        # Remove the last line (```)
        text = re.sub(r"\n?```$", "", text)
        text = text.strip()

    try:
        return json.loads(text)
    except Exception as e:
        print("Error decoding JSON from Gemini response:", e)
        return {"error": "Invalid response from Gemini model", "raw_response": text}