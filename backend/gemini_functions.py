import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

def gemini_ocr(images):
    client = genai.Client(
        api_key=os.getenv("GEMINI_API_KEY"),
    )
    response = client.models.generate_content(
    model="gemini-2.0-flash-exp",
    contents=["Extract all the text from this image accurately. Just return the text, no explanations.", images]
    )
    return response.text