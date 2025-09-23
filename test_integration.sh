#!/bin/bash

# Credexa Integration Test Script
echo "🧪 Testing Credexa ML Integration"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test endpoints
ML_SERVICE_URL="http://localhost:5000"
BACKEND_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}Testing services...${NC}"
echo ""

# Test ML service
echo -e "${YELLOW}1. Testing ML Service (${ML_SERVICE_URL})${NC}"
curl -s "${ML_SERVICE_URL}/health" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ML Service is running${NC}"
    
    # Test ML endpoints
    echo -e "${BLUE}   Testing /api/test endpoint...${NC}"
    curl -s "${ML_SERVICE_URL}/api/test" | grep -q "api_status"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Test endpoint working${NC}"
    else
        echo -e "${RED}   ❌ Test endpoint failed${NC}"
    fi
    
    echo -e "${BLUE}   Testing job search endpoint...${NC}"
    curl -s -X POST "${ML_SERVICE_URL}/api/search-jobs" \
         -H "Content-Type: application/json" \
         -d '{"query":"python developer","location":"","limit":3}' | grep -q "success"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Job search endpoint working${NC}"
    else
        echo -e "${RED}   ❌ Job search endpoint failed${NC}"
    fi
else
    echo -e "${RED}❌ ML Service is not running${NC}"
    echo -e "${YELLOW}   Start it with: cd ML && ./start_ml_service.sh${NC}"
fi

echo ""

# Test Backend
echo -e "${YELLOW}2. Testing Backend (${BACKEND_URL})${NC}"
curl -s "${BACKEND_URL}/test" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    
    # Test ML service connection from backend
    echo -e "${BLUE}   Testing ML service connection...${NC}"
    curl -s "${BACKEND_URL}/api/jobs/test-ml-service" | grep -q "success"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Backend can connect to ML service${NC}"
    else
        echo -e "${RED}   ❌ Backend cannot connect to ML service${NC}"
    fi
    
    echo -e "${BLUE}   Testing job search API...${NC}"
    curl -s -X POST "${BACKEND_URL}/api/jobs/search" \
         -H "Content-Type: application/json" \
         -d '{"query":"software engineer","filters":{},"userProfile":{}}' | grep -q "success"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Job search API working${NC}"
    else
        echo -e "${RED}   ❌ Job search API failed${NC}"
    fi
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo -e "${YELLOW}   Start it with: cd backend && npm run dev${NC}"
fi

echo ""

# Test Frontend
echo -e "${YELLOW}3. Testing Frontend (${FRONTEND_URL})${NC}"
curl -s "${FRONTEND_URL}" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
    echo -e "${YELLOW}   Start it with: cd frontend && npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}Integration Test Summary:${NC}"
echo "========================"

# Overall status
ml_status=$(curl -s "${ML_SERVICE_URL}/health" > /dev/null && echo "✅" || echo "❌")
backend_status=$(curl -s "${BACKEND_URL}/test" > /dev/null && echo "✅" || echo "❌")
frontend_status=$(curl -s "${FRONTEND_URL}" > /dev/null && echo "✅" || echo "❌")

echo -e "ML Service:  ${ml_status}"
echo -e "Backend:     ${backend_status}"
echo -e "Frontend:    ${frontend_status}"

echo ""
if [[ "$ml_status" == "✅" && "$backend_status" == "✅" && "$frontend_status" == "✅" ]]; then
    echo -e "${GREEN}🎉 All services are running! Integration is ready.${NC}"
    echo ""
    echo -e "${YELLOW}To test the job search:${NC}"
    echo "1. Visit ${FRONTEND_URL}"
    echo "2. Look for job search functionality"
    echo "3. Try searching for 'python developer' or 'data scientist'"
else
    echo -e "${RED}⚠️ Some services are not running. Please start them and try again.${NC}"
fi

echo ""
echo -e "${BLUE}Quick Start Commands:${NC}"
echo "ML Service:  cd ML && ./start_ml_service.sh"
echo "Backend:     cd backend && npm run dev"
echo "Frontend:    cd frontend && npm run dev"
