#!/bin/bash
# Script to setup backend development environment

echo "🚀 Mini ERP Backend Setup Script"
echo "=================================="
echo ""

# Check Java version
echo "✓ Checking Java version..."
java -version
echo ""

# Check Maven
echo "✓ Checking Maven..."
./mvnw --version
echo ""

# Clean and build
echo "✓ Building backend..."
./mvnw clean install
echo ""

# Run backend
echo "✓ Starting backend..."
./mvnw spring-boot:run

echo ""
echo "✓ Backend should be running on http://localhost:8080"
echo "✓ H2 Console: http://localhost:8080/h2-console"

