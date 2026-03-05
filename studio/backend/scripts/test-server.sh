#!/bin/bash
# DevForge V2 — Quick Server Test Script

set -e

BASE_URL="http://localhost:5680"
USER_ID="test-user-123"

echo "🧪 Testing DevForge V2 Server..."
echo ""

# Test root endpoint
echo "1️⃣ Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.'
echo ""

# Test health
echo "2️⃣ Testing health endpoint..."
curl -s "$BASE_URL/api/health" | jq '.'
echo ""

# Test Ollama health
echo "3️⃣ Testing Ollama health..."
curl -s "$BASE_URL/api/health/ollama" | jq '.'
echo ""

# Test database health
echo "4️⃣ Testing database health..."
curl -s "$BASE_URL/api/health/db" | jq '.'
echo ""

# Test auth (should fail without credentials)
echo "5️⃣ Testing auth protection..."
curl -s "$BASE_URL/api/projects" | jq '.'
echo ""

# Test with fake user ID
echo "6️⃣ Testing with user ID header..."
curl -s -H "X-User-ID: $USER_ID" "$BASE_URL/api/projects" | jq '.'
echo ""

echo "✅ All tests completed!"
