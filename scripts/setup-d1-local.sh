#!/bin/bash

# Script to setup D1 local database for development
# This script initializes the local D1 database with the schema

echo "🚀 Setting up D1 local database..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Installing..."
    npm install -g wrangler
fi

# Create the local D1 database
echo "📦 Creating local D1 database..."
wrangler d1 create DB --local 2>/dev/null || echo "Database already exists"

# Apply the schema
echo "📝 Applying schema to local D1 database..."
wrangler d1 execute DB --local --file=./prisma/d1-schema.sql

echo "✅ Local D1 database setup complete!"
echo ""
echo "You can now run:"
echo "  npm run dev  - Start the development server"
echo "  wrangler d1 execute DB --local --command 'SELECT * FROM User;'  - Query the database"
echo ""
