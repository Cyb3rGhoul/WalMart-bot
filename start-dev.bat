@echo off
setlocal enabledelayedexpansion

REM Walmart AI Assistant Development Startup Script for Windows
REM This script starts both the backend and frontend servers

echo 🚀 Starting Walmart AI Assistant Development Environment...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed or not in PATH. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check if backend port is available
netstat -an | find "5000" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port 5000 is already in use. Backend may already be running.
) else (
    echo 📡 Starting Backend Server...
    cd backend
    
    REM Check if virtual environment exists
    if not exist "venv" (
        echo 🔧 Creating Python virtual environment...
        python -m venv venv
    )
    
    REM Activate virtual environment and start backend
    echo 🔧 Activating virtual environment...
    echo 📦 Installing Python dependencies...
    echo 🚀 Starting Flask backend server on http://localhost:5000
    
    start "Backend Server" cmd /k "venv\Scripts\activate.bat && pip install -r requirements.txt && python app.py"
    cd ..
)

REM Check if frontend port is available
netstat -an | find "5173" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port 5173 is already in use. Frontend may already be running.
) else (
    echo 🎨 Starting Frontend Server...
    cd frontend
    
    REM Install dependencies and start frontend
    echo 📦 Installing Node.js dependencies...
    echo 🚀 Starting Vite frontend server on http://localhost:5173
    
    start "Frontend Server" cmd /k "npm install && npm run dev"
    cd ..
)

echo.
echo 🎉 Walmart AI Assistant is starting up!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5000
echo.
echo ⏳ Please wait a few moments for both servers to fully start...
echo.
echo Close this window when you're done, or close the individual server windows.
echo.
pause 