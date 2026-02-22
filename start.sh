#!/bin/bash

echo "🚀 VendorConnect - Starting Development Server"
echo "=============================================="
echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Starting Next.js development server..."
echo "Server will be available at: http://localhost:3000"
echo ""
echo "Test Credentials:"
echo "  Vendor:   vendor@test.com / password123"
echo "  Seller:   seller@test.com / password123"
echo "  Customer: customer@test.com / password123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
