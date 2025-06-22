import re 
import fitz  # PyMuPDF
import requests
from io import BytesIO
from PIL import Image
import os
from urllib.parse import urlparse
import unicodedata
from gemini_functions import gemini_ocr

def allowed_files(filename):
    ALLOWED_EXTENSIONS = {'jpeg', 'jpg', 'png', 'pdf'}
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_text(text: str) -> str:
    # Normalize unicode (e.g., smart quotes, long dashes)
    text = unicodedata.normalize("NFKC", text)
    # Replace hyphen + line break (common in OCR) with just a word continuation
    text = re.sub(r'-\s*\n', '', text)
    # Replace newlines, carriage returns, and tabs with space
    text = re.sub(r'[\n\r\t]', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    # Fix spacing before punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    return text.strip()

def is_scanned_pdf(doc) -> bool:
    for page in doc:
        text = page.get_text().strip()
        if text:  # If any text is found on any page
            return False
    return True  # No real text found across all pages

def extract_text_from_pdf(url: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch PDF. Status code: {response.status_code}")
    
    pdf_data = BytesIO(response.content)
    doc = fitz.open(stream=pdf_data, filetype="pdf")

    if not is_scanned_pdf(doc):
        text = "\n\n".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()
    
    text = ""
    #converting each image
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        image = Image.open(BytesIO(pix.tobytes("png")))
        images.append(image)
    text = gemini_ocr(images)
    doc.close()
    return text.strip()

def extract_text_from_image(url: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch image. Status code: {response.status_code}")
    
    image = Image.open(BytesIO(response.content))
    # hit gemini func here
    text = gemini_ocr([image])
    return text.strip()

def get_file_extension_from_url(url: str) -> str:
    path = urlparse(url).path
    filename = os.path.basename(path)
    _, ext = os.path.splitext(filename) 
    
    return ext.upper().lstrip('.')
