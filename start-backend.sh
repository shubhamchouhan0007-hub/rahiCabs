#!/bin/bash

# RahiCabs Backend Startup Script
echo "🚀 Starting RahiCabs Backend..."
echo ""

cd "$(dirname "$0")/backend"

echo "📦 Checking if Maven is available..."
if command -v mvn &> /dev/null; then
    echo "✅ Maven found!"
    echo ""
    echo "🏗️  Building and starting backend..."
    echo "⏳ This may take 30-60 seconds on first run..."
    echo ""
    mvn spring-boot:run
elif [ -f "./mvnw" ]; then
    echo "✅ Maven wrapper found!"
    echo ""
    echo "🏗️  Building and starting backend..."
    echo ""
    ./mvnw spring-boot:run
else
    echo "❌ Maven not found!"
    echo ""
    echo "Please use one of these options:"
    echo "1. Install Maven: brew install maven"
    echo "2. Use your IDE (IntelliJ/Eclipse) to run RahiCabsApplication.java"
    echo ""
    exit 1
fi
