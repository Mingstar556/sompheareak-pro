#!/usr/bin/env bash
echo "========================================================"
echo "  Starting Somphea Reak Customer Front (Port 8081)"
echo "========================================================"
echo ""
echo "  URL: http://localhost:8081"
echo ""

EXPO_NO_TELEMETRY=1 npx expo start --web --port 8081
