#!/bin/bash

echo "=== Final Fix Script ==="

# 1. Kill all processes
echo "Step 1: Killing all processes..."
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "node" 2>/dev/null
pkill -9 -f "bun" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 3

# 2. Clear all cache
echo "Step 2: Clearing cache..."
cd /home/z/my-project
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
echo "Cache cleared"

# 3. Ensure env files are correct
echo "Step 3: Setting up env files..."
cat > .env << 'EOF'
DATABASE_URL="postgresql://neondb_owner:npg_8VWQD3iHtPAp@ep-bitter-sound-amro63xu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=smiley-dental-clinic-secret-key-2024-production-ready-secure
NODE_ENV=development
EOF

cat > .env.local << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_8VWQD3iHtPAp@ep-bitter-sound-amro63xu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
EOF

cat > .env.development << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_8VWQD3iHtPAp@ep-bitter-sound-amro63xu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
EOF

echo "Env files created"

# 4. Install dependencies
echo "Step 4: Installing @prisma/client..."
bun install @prisma/client
sleep 2

# 5. Generate Prisma Client with explicit URL
echo "Step 5: Generating Prisma Client..."
DATABASE_URL="postgresql://neondb_owner:npg_8VWQD3iHtPAp@ep-bitter-sound-amro63xu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma generate
sleep 2

# 6. Verify Prisma Client
echo "Step 6: Verifying Prisma Client..."
ls -la node_modules/.prisma/
ls -la node_modules/@prisma/client/

# 7. Start server
echo "Step 7: Starting server..."
bun run dev

