#!/bin/bash

# Script to start the project with PostgreSQL (NeonDB)

export DATABASE_URL="postgresql://neondb_owner:npg_XENWv3hDBr1i@ep-delicate-forest-aix7rt02-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "🚀 Starting Smiley Dental Clinic with PostgreSQL (NeonDB)..."
echo "📊 Database: PostgreSQL - NeonDB"
echo ""

# Start development server
bun run dev
