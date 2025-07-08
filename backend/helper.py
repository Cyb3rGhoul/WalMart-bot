import re 
import fitz  # PyMuPDF
import requests
from io import BytesIO
from PIL import Image
import os
from urllib.parse import urlparse
import unicodedata
from gemini_functions import gemini_ocr

OCR_SPACE_API_KEY = os.getenv('OCR_SPACE_API_KEY')

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

def ocr_space_image_url(image_url):
    payload = {
        'url': image_url,
        'isOverlayRequired': False,
        'apikey': OCR_SPACE_API_KEY,
        'language': 'eng',
    }
    r = requests.post('https://api.ocr.space/parse/image', data=payload)
    try:
        result = r.json()
    except Exception:
        return ''
    if isinstance(result, dict) and result.get('IsErroredOnProcessing') == False and result.get('ParsedResults'):
        return result['ParsedResults'][0]['ParsedText']
    return ''

def ocr_space_image_file(image_bytes):
    payload = {
        'isOverlayRequired': False,
        'apikey': OCR_SPACE_API_KEY,
        'language': 'eng',
    }
    files = {'file': ('page.png', image_bytes, 'image/png')}
    r = requests.post('https://api.ocr.space/parse/image', files=files, data=payload)
    try:
        result = r.json()
    except Exception:
        return ''
    if isinstance(result, dict) and result.get('IsErroredOnProcessing') == False and result.get('ParsedResults'):
        return result['ParsedResults'][0]['ParsedText']
    return ''

def extract_text_from_pdf(url: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch PDF. Status code: {response.status_code}")
    
    pdf_data = BytesIO(response.content)
    doc = fitz.open(stream=pdf_data, filetype="pdf")

    if not is_scanned_pdf(doc):
        text = "\n\n".join(page.get_text() for page in doc)
        doc.close()
        print("NOT A SCANNED PDF")
        return text.strip()
    
    # SCANNED PDF: run OCR.Space on each page image
    texts = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img_bytes = BytesIO(pix.tobytes("png"))
        img_bytes.seek(0)
        ocr_text = ocr_space_image_file(img_bytes)
        texts.append(ocr_text)
    doc.close()
    return "\n".join(texts).strip()

def extract_text_from_image(url: str) -> str:
    # Use OCR.Space directly on the image URL
    text = ocr_space_image_url(url)
    return text.strip()

def get_file_extension_from_url(url: str) -> str:
    path = urlparse(url).path
    filename = os.path.basename(path)
    _, ext = os.path.splitext(filename) 
    
    return ext.upper().lstrip('.')
