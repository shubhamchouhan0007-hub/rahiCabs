#!/bin/bash

# RahiCabs Frontend Startup Script
echo "🚀 Starting RahiCabs Frontend..."
echo ""

cd "$(dirname "$0")/frontend"

echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies (first time only)..."
    echo "⏳ This may take 2-3 minutes..."
    echo ""
    npm install
    echo ""
fi

echo "🎨 Starting development server..."
echo "📱 Frontend will be available at: http://localhost:5173"
echo ""
npm run dev
