#!/bin/bash

# Credexa ML Service Startup Script
echo "🚀 Starting Credexa ML Job Search Service"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to ML directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Please run ./setup_ml_service.sh first${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Check if requirements are installed
echo -e "${BLUE}Checking dependencies...${NC}"
python3 -c "
import sys
try:
    import flask
    import requests
    from career_assistant import CareerAssistant
    print('✅ All dependencies found')
except ImportError as e:
    print(f'❌ Missing dependency: {e}')
    print('Please run ./setup_ml_service.sh to install dependencies')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    exit 1
fi

echo -e "${GREEN}✅ Dependencies verified${NC}"
echo ""

# Start the ML API server
echo -e "${YELLOW}Starting ML API server on port 5000...${NC}"
echo "Press Ctrl+C to stop the server"
echo ""

export DEBUG=true
python3 ml_api_server.py
