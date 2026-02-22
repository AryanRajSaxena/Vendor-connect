@echo off
echo.
echo 🚀 VendorConnect - Commission-Based Marketplace MVP
echo =====================================================
echo.
echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully
echo.
echo Starting Next.js development server...
echo.
echo 🌐 Application will be available at: http://localhost:3000
echo.
echo 🔐 Test Credentials:
echo    Vendor:   vendor@test.com / password123
echo    Seller:   seller@test.com / password123
echo    Customer: customer@test.com / password123
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.

call npm run dev
