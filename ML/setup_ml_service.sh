#!/bin/bash

# Credexa ML Service Setup and Test Script
echo "🚀 Setting up Credexa ML Service Integration"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is installed
echo -e "${BLUE}Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3 found: $(python3 --version)${NC}"
else
    echo -e "${RED}❌ Python3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check if pip is installed
echo -e "${BLUE}Checking pip installation...${NC}"
if command -v pip3 &> /dev/null; then
    echo -e "${GREEN}✅ pip3 found${NC}"
else
    echo -e "${RED}❌ pip3 not found. Please install pip.${NC}"
    exit 1
fi

# Navigate to ML directory
cd "$(dirname "$0")"
echo -e "${BLUE}Current directory: $(pwd)${NC}"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Install requirements for ML API
echo -e "${BLUE}Installing ML API requirements...${NC}"
if [ -f "requirements_api.txt" ]; then
    pip install -r requirements_api.txt
    echo -e "${GREEN}✅ ML API requirements installed${NC}"
else
    echo -e "${RED}❌ requirements_api.txt not found${NC}"
    exit 1
fi

# Install career assistant requirements
echo -e "${BLUE}Installing career assistant requirements...${NC}"
if [ -f "career_assistant/requirements.txt" ]; then
    pip install -r career_assistant/requirements.txt
    echo -e "${GREEN}✅ Career assistant requirements installed${NC}"
else
    echo -e "${YELLOW}⚠️ career_assistant/requirements.txt not found, skipping...${NC}"
fi

# Test the ML service
echo -e "${BLUE}Testing ML service...${NC}"
python3 -c "
import sys
import os
sys.path.insert(0, 'career_assistant')
sys.path.insert(0, 'career_assistant/src')

try:
    from career_assistant import CareerAssistant
    from user_profile import create_sample_profile
    print('✅ ML modules imported successfully')
    
    # Test basic functionality
    assistant = CareerAssistant()
    profile = create_sample_profile()
    print(f'✅ Sample profile created: {profile.experience_level} level with {len(profile.skills)} skills')
    
    # Test job search
    jobs = assistant.search_jobs('python developer', '', 3)
    print(f'✅ Job search test: Found {len(jobs)} jobs')
    
    print('✅ ML service test completed successfully')
except Exception as e:
    print(f'❌ ML service test failed: {e}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ML service test passed${NC}"
else
    echo -e "${RED}❌ ML service test failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start the ML API server:"
echo "   ${BLUE}python3 ml_api_server.py${NC}"
echo ""
echo "2. In another terminal, start your backend:"
echo "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "3. In another terminal, start your frontend:"
echo "   ${BLUE}cd frontend && npm run dev${NC}"
echo ""
echo "4. Test the integration by visiting:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Useful endpoints for testing:${NC}"
echo "- ML Service Health: ${BLUE}http://localhost:5000/health${NC}"
echo "- ML Service Test: ${BLUE}http://localhost:5000/api/test${NC}"
echo "- Backend Test ML: ${BLUE}http://localhost:4000/api/jobs/test-ml-service${NC}"
