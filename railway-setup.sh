#!/bin/bash
set -e

echo "🚂 DevForge V2 — Railway Setup Automation"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ID="e01b1644-1bae-4d2e-978d-be1138cbec64"
SERVICE_ID="38e54027-9fa5-408f-947a-c058c82fba5c"

cd ~/devforge-v2/studio/backend

echo -e "${BLUE}📋 Current Status:${NC}"
railway status

echo ""
echo -e "${YELLOW}⚙️  Step 1: Configure Environment Variables${NC}"
echo ""

# Check if ANTHROPIC_API_KEY is provided
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ ANTHROPIC_API_KEY not set"
  echo ""
  echo "Please run with:"
  echo "  export ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY"
  echo "  ./railway-setup.sh"
  exit 1
fi

# Set required variables
echo "Setting ANTHROPIC_API_KEY..."
railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

# Optional: Set Ollama config (for remote)
if [ -n "$OLLAMA_BASE_URL" ]; then
  echo "Setting OLLAMA_BASE_URL..."
  railway variables set OLLAMA_BASE_URL="$OLLAMA_BASE_URL"
  railway variables set OLLAMA_MODEL_DEV="qwen2.5-coder:32b"
  railway variables set OLLAMA_MODEL_FIX="qwen2.5-coder:14b"
fi

# Optional: Deploy tokens
if [ -n "$VERCEL_TOKEN" ]; then
  echo "Setting VERCEL_TOKEN..."
  railway variables set VERCEL_TOKEN="$VERCEL_TOKEN"
fi

if [ -n "$RAILWAY_TOKEN" ]; then
  echo "Setting RAILWAY_TOKEN..."
  railway variables set RAILWAY_TOKEN="$RAILWAY_TOKEN"
fi

if [ -n "$GITHUB_TOKEN" ]; then
  echo "Setting GITHUB_TOKEN..."
  railway variables set GITHUB_TOKEN="$GITHUB_TOKEN"
fi

echo ""
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

echo -e "${YELLOW}⚙️  Step 2: Add PostgreSQL Database${NC}"
echo ""
echo "⚠️  Please add PostgreSQL manually via Railway Dashboard:"
echo "  1. Open: https://railway.com/project/$PROJECT_ID"
echo "  2. Click: + New"
echo "  3. Select: Database → PostgreSQL"
echo "  4. Wait for provisioning (~1 min)"
echo ""
read -p "Press Enter when PostgreSQL is ready..."

echo ""
echo -e "${YELLOW}⚙️  Step 3: Run Database Migration${NC}"
echo ""

# Check if DATABASE_URL is set
if railway run printenv | grep -q DATABASE_URL; then
  echo "DATABASE_URL found, running migration..."
  railway run npx prisma db push
  echo -e "${GREEN}✅ Database migrated${NC}"
else
  echo "❌ DATABASE_URL not found"
  echo "Make sure PostgreSQL is added and linked to the service"
  exit 1
fi

echo ""
echo -e "${YELLOW}⚙️  Step 4: Redeploy Backend${NC}"
echo ""
railway service redeploy devforge-backend

echo ""
echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""
echo "Testing health endpoint..."
sleep 10

# Get the public URL
BACKEND_URL=$(railway service status --all | grep -o "https://[^ ]*" | head -1)

if [ -n "$BACKEND_URL" ]; then
  echo "Checking: $BACKEND_URL/api/health"
  curl -s "$BACKEND_URL/api/health" | jq '.' || echo "Health check failed"
else
  echo "Could not determine backend URL"
  echo "Check manually: railway service status --all"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Deploy Frontend: cd ~/devforge-v2/studio/frontend && railway init && railway up"
echo "  2. Test full pipeline: Create first project"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
