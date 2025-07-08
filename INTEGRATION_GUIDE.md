# Frontend-Backend Integration Guide

This guide explains how the Walmart AI Assistant frontend and backend are integrated and how to set up the complete system.

## 🏗️ Architecture Overview

The Walmart AI Assistant consists of two main components:

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Frontend      │ ◄────────────► │    Backend      │
│   (React)       │                │   (Flask)       │
└─────────────────┘                └─────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│   Browser APIs  │                │   External APIs │
│ • Speech API    │                │ • Gemini AI     │
│ • File API      │                │ • Cloudinary    │
└─────────────────┘                └─────────────────┘
```

## 🔗 Integration Points

### 1. API Communication

- **Protocol**: HTTP REST API
- **Base URL**: Configurable via `VITE_BACKEND_URL` environment variable
- **CORS**: Enabled on backend for cross-origin requests
- **Authentication**: None (development setup)

### 2. Data Flow

#### Chat Messages

```
User Input → Frontend → Backend → Gemini AI → Backend → Frontend → User
```

#### File Upload & OCR

```
File Upload → Frontend → Backend → Cloudinary → Backend → OCR → AI → Frontend
```

#### Voice Features

```
Voice Input → Browser Speech API → Frontend → Backend → AI → Frontend → Speech Synthesis
```

## 🛠️ Setup Instructions

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Git** for cloning the repository

### Quick Start

#### Option 1: Using Startup Scripts

```bash
# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh

# Windows
start-dev.bat
```

#### Option 2: Manual Setup

1. **Clone and Setup Backend**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

2. **Setup Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📡 API Endpoints

### Health Check

```http
GET /ping
Response: {"message": "system healthy"}
```

### AI Chat

```http
POST /respond
Content-Type: application/json
Body: {"user_prompt": "Hello, how can you help me?"}
Response: {"message": "AI response text"}
```

### File Upload

```http
POST /upload-doc
Content-Type: multipart/form-data
Body: FormData with 'file' field
Response: {
  "message": "Document uploaded successfully",
  "document_url": ["https://cloudinary.com/..."],
  "status": 1
}
```

### OCR Processing

```http
POST /get-OCR
Content-Type: application/json
Body: {"document_urls": "https://cloudinary.com/..."}
Response: {"response": "Extracted text from document"}
```

## 🔧 Configuration

### Frontend Environment Variables

Create `.env.local` in the frontend directory:

```env
VITE_BACKEND_URL=http://127.0.0.1:5000
VITE_DEBUG=true
```

### Backend Environment Variables

Create `.env` in the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MAX_CONTENT_LENGTH=10485760
```

## 🎯 Key Features Integration

### 1. Real-time Chat

- **Frontend**: React state management for messages
- **Backend**: Flask routes for AI responses
- **Integration**: Axios HTTP requests with error handling

### 2. File Upload & OCR

- **Frontend**: File input with validation
- **Backend**: Cloudinary upload + Gemini OCR
- **Integration**: FormData upload with progress tracking

### 3. Voice Features

- **Frontend**: Web Speech APIs
- **Backend**: Text processing
- **Integration**: Speech-to-text → API → text-to-speech

### 4. Connection Monitoring

- **Frontend**: Health check polling
- **Backend**: Ping endpoint
- **Integration**: Automatic status updates

## 🔍 Error Handling

### Frontend Error Handling

```javascript
// API Service error handling
const result = await ApiService.generateResponse(message);
if (result.success) {
  // Handle success
} else {
  // Handle error with user-friendly message
  console.error("API Error:", result.message);
}
```

### Backend Error Handling

```python
@app.route("/respond", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        message = data["user_prompt"]
        return {"message": respond(message)}
    except Exception as e:
        return {"error": str(e)}, 500
```

## 🧪 Testing the Integration

### 1. Health Check

```bash
curl http://localhost:5000/ping
# Expected: {"message": "system healthy"}
```

### 2. Chat Test

```bash
curl -X POST http://localhost:5000/respond \
  -H "Content-Type: application/json" \
  -d '{"user_prompt": "Hello"}'
```

### 3. File Upload Test

```bash
curl -X POST http://localhost:5000/upload-doc \
  -F "file=@test-image.jpg"
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure backend CORS is configured
   - Check frontend URL matches backend CORS settings

2. **Connection Refused**

   - Verify backend is running on port 5000
   - Check firewall settings

3. **File Upload Failures**

   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure file types are supported

4. **AI Response Errors**
   - Verify Gemini API key is set
   - Check API quota limits

### Debug Mode

Enable detailed logging:

```env
# Frontend
VITE_DEBUG=true

# Backend
FLASK_DEBUG=1
```

## 📊 Monitoring

### Frontend Monitoring

- Connection status indicator
- Request/response logging
- Error tracking
- Performance metrics

### Backend Monitoring

- Request logging
- Error tracking
- API response times
- Resource usage

## 🔄 Development Workflow

1. **Start both servers** using startup scripts
2. **Make changes** to frontend or backend code
3. **Hot reload** will automatically refresh
4. **Test features** in the browser
5. **Check logs** for any errors
6. **Restart servers** if needed

## 🚀 Production Deployment

### Frontend Build

```bash
cd frontend
npm run build
# Deploy dist/ folder to web server
```

### Backend Deployment

```bash
cd backend
pip install -r requirements.txt
# Deploy to production server (e.g., Heroku, AWS, etc.)
```

### Environment Configuration

- Set production environment variables
- Configure CORS for production domain
- Set up proper SSL certificates
- Configure logging and monitoring

## 📚 Additional Resources

- [Frontend README](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./API_DOCS.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

This integration provides a seamless experience between the React frontend and Flask backend, enabling real-time AI chat, file processing, and voice interactions for the Walmart AI Assistant.
