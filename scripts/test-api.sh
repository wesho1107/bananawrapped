#!/bin/bash

# Test script for Base Styles API endpoints
# Make sure your dev server is running: pnpm dev
# Make sure MONGODB_URI is set in .env.local

BASE_URL="http://localhost:3000/api/base-styles"

echo "🧪 Testing Base Styles API"
echo "=========================="
echo ""

# Test 1: GET all base styles (should return empty array initially)
echo "1️⃣  Testing GET /api/base-styles"
echo "   Request: GET $BASE_URL"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL")
http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')
echo "   Status: $http_code"
echo "   Response: $body"
echo ""

# Test 2: POST - Create a new base style image
echo "2️⃣  Testing POST /api/base-styles"
echo "   Creating a test base style image..."

# Create a minimal base64 test image (1x1 red pixel PNG)
TEST_IMAGE_BASE64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

json_data=$(cat <<EOF
{
  "name": "Test Base Style",
  "imageUrl": "$TEST_IMAGE_BASE64",
  "thumbnailUrl": "$TEST_IMAGE_BASE64"
}
EOF
)

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$json_data" \
  "$BASE_URL")

http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')
echo "   Status: $http_code"
echo "   Response: $body"
echo ""

# Extract ID if creation was successful
if [ "$http_code" = "201" ]; then
  ID=$(echo "$body" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
  echo "   ✅ Created with ID: $ID"
  echo ""

  # Test 3: GET specific base style by ID
  echo "3️⃣  Testing GET /api/base-styles/$ID"
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/$ID")
  http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')
  echo "   Status: $http_code"
  echo "   Response: $body"
  echo ""

  # Test 4: PUT - Update base style
  echo "4️⃣  Testing PUT /api/base-styles/$ID"
  update_json=$(cat <<EOF
{
  "name": "Updated Test Base Style"
}
EOF
)
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -d "$update_json" \
    "$BASE_URL/$ID")
  http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')
  echo "   Status: $http_code"
  echo "   Response: $body"
  echo ""

  # Test 5: DELETE - Delete base style
  echo "5️⃣  Testing DELETE /api/base-styles/$ID"
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X DELETE \
    "$BASE_URL/$ID")
  http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')
  echo "   Status: $http_code"
  echo "   Response: $body"
  echo ""
else
  echo "   ❌ Failed to create base style. Cannot test other endpoints."
fi

echo "✅ Testing complete!"

