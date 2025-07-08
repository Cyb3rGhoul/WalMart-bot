# Walmart AI Assistant Frontend

A modern React-based chat interface for the Walmart AI Assistant with voice capabilities, file upload, and real-time AI responses.

## Features

- 🤖 **AI Chat Interface** - Real-time conversation with Walmart AI Assistant
- 🎤 **Voice Recording** - Speech-to-text functionality
- 🔊 **Text-to-Speech** - AI responses are spoken aloud
- 📁 **File Upload** - Upload images and PDFs for OCR processing
- 🔄 **Real-time Status** - Connection status monitoring
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Backend Integration

This frontend is fully integrated with the Flask backend API. The integration includes:

### API Endpoints Used

- `GET /ping` - Health check and connection status
- `POST /respond` - AI chat responses
- `POST /upload-doc` - File upload and storage
- `POST /get-OCR` - Text extraction from documents

### Features

- **Automatic Connection Monitoring** - Checks backend health on startup
- **File Upload & OCR** - Upload images/PDFs and extract text for AI analysis
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Request Timeouts** - Configurable timeouts for different operations

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Clone the repository**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the frontend directory:

   ```env
   VITE_BACKEND_URL=http://127.0.0.1:5000
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Environment Variables

| Variable           | Default                 | Description            |
| ------------------ | ----------------------- | ---------------------- |
| `VITE_BACKEND_URL` | `http://127.0.0.1:5000` | Backend API server URL |

## API Service

The frontend uses a centralized API service (`src/services/apiService.js`) that provides:

- **Connection Management** - Automatic health checks and status monitoring
- **File Upload** - Document upload with validation and OCR processing
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Request Interceptors** - Logging and error tracking
- **Timeout Management** - Configurable timeouts for different operations

### Usage Example

```javascript
import ApiService from "../services/apiService.js";

// Check backend connection
const connection = await ApiService.checkConnection();

// Generate AI response
const response = await ApiService.generateResponse(
  "Hello, how can you help me?"
);

// Upload and process document
const result = await ApiService.uploadAndProcessDocument(
  file,
  "Analyze this document"
);
```

## File Upload

The application supports uploading:

- **Images**: JPEG, JPG, PNG
- **Documents**: PDF
- **Max Size**: 10MB

Uploaded files are:

1. Validated for type and size
2. Uploaded to Cloudinary via backend
3. Processed with OCR to extract text
4. Sent to AI for analysis and response

## Voice Features

### Speech-to-Text

- Uses Web Speech API
- Supports multiple languages
- Real-time transcription
- Error handling for unsupported browsers

### Text-to-Speech

- Uses Web Speech Synthesis API
- Automatic voice selection
- Configurable speech parameters
- Sound toggle functionality

## Error Handling

The application includes comprehensive error handling:

- **Network Errors** - Connection issues and timeouts
- **File Upload Errors** - Invalid files, size limits, upload failures
- **API Errors** - Server errors, invalid responses
- **Browser Compatibility** - Feature detection and fallbacks

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── WalmartChatbot.jsx
│   ├── Message.jsx
│   ├── VoiceRecorder.jsx
│   └── Preloader.jsx
├── services/           # API and utility services
│   └── apiService.js
├── config/            # Configuration files
│   └── api.js
└── App.jsx           # Main application component
```

### Key Components

- **WalmartChatbot** - Main chat interface with all features
- **Message** - Individual message display component
- **VoiceRecorder** - Speech-to-text recording interface
- **ApiService** - Centralized API communication service

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**

   - Ensure backend server is running
   - Check `VITE_BACKEND_URL` in environment variables
   - Verify CORS settings on backend

2. **File Upload Issues**

   - Check file size (max 10MB)
   - Verify file type (JPEG, PNG, PDF only)
   - Ensure backend has proper Cloudinary configuration

3. **Voice Features Not Working**
   - Check browser compatibility
   - Ensure microphone permissions are granted
   - Verify HTTPS for production deployments

### Debug Mode

Enable debug logging by setting:

```env
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Walmart AI Assistant system.
