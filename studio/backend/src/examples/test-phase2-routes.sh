#!/bin/bash
# DevForge V2 — FASE 2 Routes Testing Script

# Configuração
API_URL="http://localhost:5680/api"
USER_ID="cm7f8g9h0123456789abcdef" # Substituir com user ID real
PROJECT_ID="cm7f8g9h0987654321fedcba" # Substituir com project ID real

echo "========================================="
echo "DevForge V2 — FASE 2 Routes Testing"
echo "========================================="
echo ""

# =====================
# TEAM ROUTES
# =====================
echo "1. GET /api/projects/:id/team - List team members"
curl -s -X GET \
  "$API_URL/projects/$PROJECT_ID/team" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "2. POST /api/projects/:id/team - Add team member"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/team" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "displayName": "João Silva",
    "email": "joao@example.com",
    "role": "DEVELOPER",
    "avatar": "https://avatar.com/joao.png"
  }' | jq '.'
echo ""

# =====================
# SPRINTS ROUTES
# =====================
echo "3. GET /api/projects/:id/sprints - List sprints"
curl -s -X GET \
  "$API_URL/projects/$PROJECT_ID/sprints" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "4. POST /api/projects/:id/sprints - Create sprint"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/sprints" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Implementar autenticação e dashboard inicial",
    "startDate": "2026-03-10T00:00:00Z",
    "endDate": "2026-03-24T00:00:00Z",
    "plannedPoints": 40
  }' | jq '.'
echo ""

SPRINT_ID=$(curl -s -X GET "$API_URL/projects/$PROJECT_ID/sprints" \
  -H "x-user-id: $USER_ID" | jq -r '.[0].id')

echo "5. POST /api/projects/:id/sprints/:sid/start - Start sprint"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/sprints/$SPRINT_ID/start" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# =====================
# FEATURES ROUTES
# =====================
TEAM_MEMBER_ID=$(curl -s -X GET "$API_URL/projects/$PROJECT_ID/team" \
  -H "x-user-id: $USER_ID" | jq -r '.[0].id')

echo "6. POST /api/projects/:id/features - Create feature"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/features" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login com email e password",
    "description": "Implementar sistema de autenticação usando JWT. Deve incluir validação de email, hash de password com bcrypt, e refresh tokens.",
    "acceptanceCriteria": "[\"User pode fazer login com email/password\", \"Token JWT válido por 1h\", \"Refresh token válido por 7 dias\", \"Erros apresentados de forma clara\"]",
    "priority": "HIGH",
    "type": "FEATURE",
    "sprintId": "'$SPRINT_ID'",
    "requestedById": "'$TEAM_MEMBER_ID'"
  }' | jq '.'
echo ""

echo "7. GET /api/projects/:id/features - List features"
curl -s -X GET \
  "$API_URL/projects/$PROJECT_ID/features" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

FEATURE_ID=$(curl -s -X GET "$API_URL/projects/$PROJECT_ID/features" \
  -H "x-user-id: $USER_ID" | jq -r '.[0].id')

echo "8. PUT /api/projects/:id/features/:fid - Update feature"
curl -s -X PUT \
  "$API_URL/projects/$PROJECT_ID/features/$FEATURE_ID" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READY"
  }' | jq '.'
echo ""

echo "9. POST /api/projects/:id/features/:fid/start-build - Start feature build"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/features/$FEATURE_ID/start-build" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "10. POST /api/projects/:id/features/:fid/comment - Add comment"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/features/$FEATURE_ID/comment" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "A implementar JWT com RS256. Estimativa: 5 story points.",
    "authorId": "'$TEAM_MEMBER_ID'"
  }' | jq '.'
echo ""

# =====================
# SPRINT COMPLETION
# =====================
echo "11. POST /api/projects/:id/sprints/:sid/end - End sprint"
curl -s -X POST \
  "$API_URL/projects/$PROJECT_ID/sprints/$SPRINT_ID/end" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="
