from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import uuid
from helper import allowed_files, cleanup_text, extract_text_from_image, extract_text_from_pdf, get_file_extension_from_url
import cloudinary
import cloudinary.uploader
import os
from werkzeug.utils import secure_filename
import mimetypes
import time

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

cloudinary.config( 
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'), 
    secure=False
)


@app.route("/",methods=['GET'])
def hello():
    return {"message": "hello world"}

@app.route('/ping', methods=['GET'])
def ping():
    return {"message": "system healthy"}, 200

@app.route("/upload-doc", methods=["POST"])
def upload_doc():
        app.logger.info("/upload-doc endpoint hit!")

        documentUrls = []
        try:
            file = request.files[f'file']
            filename = secure_filename(file.filename)
            if file and allowed_files(filename):
                if file.content_length > eval(os.getenv("MAX_CONTENT_LENGTH")):
                    return jsonify({"message": "File size exceeded 10 MB limit", "status": 0, "status_code": 400, "data": []}), 400
                mime_type, _ = mimetypes.guess_type(file.filename)
                
                object_key = str(time.time()) + "/"+ file.filename
                upload_result = cloudinary.uploader.upload(file,
                                            public_id=object_key)
                
                documentUrls.append(upload_result["secure_url"])

            else:
                return {
                    "message": "Invalid file mime type",
                    "error_msg": str(e),
                    "status": 0,
                    "status_code": 400,
                    "data": [],
                }, 400
            return jsonify({"message": "Document uploaded successfully",
                                    "document_url": documentUrls,  
                                    "status": 1,
                                    "status_code": 200,
                                    "mime_type": mime_type,
                                    # "doc_type": file_type,
                                    "data": [],
                            }), 200
        except Exception as e:
            app.logger.error(f"General Exception: {str(e)}")
            return {
                "message": "some error occurred",
                "error_msg": str(e),
                "status": 0,
                "data": [],
                "status_code": 500,
            }, 500

@app.route("/get-OCR",methods=["POST"])
def get_ocr():
    data = request.get_json()
    doc_url = data.get("document_urls")
    filename = get_file_extension_from_url(doc_url)
    if filename in ['JPG', 'JPEG', 'PNG']:
        # hit extract from image
        response = extract_text_from_image(doc_url)
        response = cleanup_text(response)
        return jsonify({"response": response}),200
    elif filename in ['PDF']:
        #hit extract from pdf
        response = extract_text_from_pdf(doc_url)
        response = cleanup_text(response)
        return jsonify({"response": response}),200
    else:
        return jsonify({"error":"File type not supported"}),500 # won't hit due to upload-doc getting called first
    

if __name__ == "__main__":
    app.run(port=5000)