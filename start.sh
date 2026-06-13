#!/bin/bash
# Mini ERP Quick Start Script

echo ""
echo "🪑  Shiv Furniture Mini ERP — Starting Up"
echo "==========================================="
echo ""

# Start backend
echo "▶  Starting Spring Boot backend (port 8080)..."
cd backend
if [ -f "./mvnw" ]; then
  chmod +x ./mvnw && ./mvnw spring-boot:run &
else
  mvn spring-boot:run &
fi
BACKEND_PID=$!
cd ..

echo "   Backend PID: $BACKEND_PID"
echo "   Waiting for backend to boot (first run ~30s)..."
sleep 20

echo ""
echo "▶  Starting React frontend (port 5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==========================================="
echo "✅  All systems go!"
echo ""
echo "   🌐  App:        http://localhost:5173"
echo "   🔧  API:        http://localhost:8080/api"
echo "   🗄️  H2 Console: http://localhost:8080/h2-console"
echo ""
echo "   Login: admin / admin123"
echo "==========================================="
echo ""
echo "Press Ctrl+C to stop all servers"

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
