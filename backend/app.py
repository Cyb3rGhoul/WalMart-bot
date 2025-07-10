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
from gemini_functions import respond

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global session storage
conversation_sessions = {}

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

@app.route("/start_session", methods=['POST'])
def start_session():
    session_id = str(uuid.uuid4())
    conversation_sessions[session_id] = {
        "history": [],
        "created_at": time.time()
    }
    return jsonify({"session_id": session_id})

@app.route("/upload-doc", methods=["POST"])
def upload_doc():
        app.logger.info("/upload-doc endpoint hit!")

        documentUrls = []
        try:
            file = request.files[f'file']
            filename = secure_filename(file.filename)
            if file and allowed_files(filename):
                max_size = os.getenv("MAX_CONTENT_LENGTH")
                if max_size is not None:
                    max_size = int(max_size)
                else:
                    max_size = 10 * 1024 * 1024 
                if file.content_length > max_size:
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
    
@app.route("/respond", methods=["POST"])
def generate_response():
    data = request.get_json()
    message = data["user_prompt"]
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    if session_id not in conversation_sessions:
        return jsonify({"error": "Invalid or expired session_id. Please start a new session."}), 404

    # Get conversation history
    history = conversation_sessions[session_id]["history"]
    history.append({"role": "user", "content": message})

    # Build context for Gemini
    context = "\n".join([f"{h['role']}: {h['content']}" for h in history])
    system_prompt = (
        """
You are Walmart AI Assistant. You help users manage and update their grocery list, answer questions about their list, and keep track of the conversation context.

If the latest user message contains a grocery list (not a receipt, not a menu), extract the items and their quantities, and present the list in a normal, friendly, readable format (not JSON). Then ask: "Is this your final list or do you want to update it? Allow users to update the list"

If the user finalize the list, return the list in JSON format only, with no extra text. Also quantity should be only numbers, no words, no units. Example: {[{"name": "apple", "quantity": 1}, {"name": "banana", "quantity": 2}]}

After returning list u will receive a new list that are similar recommended products from my api, show users list by telling these are recommended products and ask users if he want something from the list(remove items that were already present in previous list). Clear previous list as it is added in cart. Ask quantity also then repeat above process of finalizing list and sharing.

Otherwise, continue the conversation as normal, using the conversation history below to understand what the user is referring to.

Also great user properly.
"""
    )
    full_prompt = f"{system_prompt}\n\nConversation so far:\n{context}\n\nRespond to the user's latest message as Walmart AI Assistant."
    ai_response = respond(full_prompt)

    # Add AI response to history
    history.append({"role": "assistant", "content": ai_response})
    
    # Keep only the last 20 messages (10 user+assistant pairs)
    conversation_sessions[session_id]["history"] = history[-20:]
    
    print(f"Session {session_id} history: {len(history)} messages")
    return {"message": ai_response}

@app.route("/end_session", methods=["POST"])
def end_session():
    data = request.get_json()
    session_id = data.get("session_id")

    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
        return jsonify({"message": f"Session {session_id} ended and cleared."}), 200
    else:
        return jsonify({"error": "Session ID not found or already ended."}), 404

if __name__ == "__main__":
    app.run(port=5000, use_reloader=True)