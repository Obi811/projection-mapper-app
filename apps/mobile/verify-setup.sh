#!/bin/bash
# Projection Mapper Mobile - Setup Verification Script
# Überprüft, ob alle Voraussetzungen für die Mobile-App-Entwicklung erfüllt sind

# Note: Don't use set -e here, we want to continue checking even if something fails

echo "🔍 Projection Mapper Mobile - Setup-Verifizierung"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installiert: $NODE_VERSION"
    
    # Version check
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js Version >= 18 (OK)"
    else
        check_warn "Node.js Version < 18 (bitte aktualisieren auf v20+)"
    fi
else
    check_fail "Node.js nicht gefunden! Bitte installieren: https://nodejs.org/"
fi
echo ""

# 2. npm
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installiert: $NPM_VERSION"
else
    check_fail "npm nicht gefunden! (sollte mit Node.js installiert worden sein)"
fi
echo ""

# 3. Projekt-Dependencies
echo "3️⃣  Checking Projekt-Dependencies..."
if [ -d "../../node_modules" ]; then
    check_pass "Root node_modules vorhanden"
else
    check_fail "Root node_modules fehlt! Führe aus: npm install (im Projekt-Root)"
fi

if [ -d "node_modules" ]; then
    check_pass "Mobile node_modules vorhanden"
else
    check_warn "Mobile node_modules fehlt (wird automatisch vom Root installiert)"
fi
echo ""

# 4. EAS CLI
echo "4️⃣  Checking EAS CLI..."
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version)
    check_pass "EAS CLI installiert: $EAS_VERSION"
else
    check_fail "EAS CLI nicht gefunden! Installiere: npm install -g eas-cli"
fi
echo ""

# 5. Expo CLI
echo "5️⃣  Checking Expo CLI..."
if [ -f "../../node_modules/.bin/expo" ] || [ -f "node_modules/.bin/expo" ]; then
    check_pass "Expo CLI verfügbar (in node_modules)"
else
    check_warn "Expo CLI nicht gefunden (sollte nach npm install verfügbar sein)"
fi
echo ""

# 6. Git
echo "6️⃣  Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    check_pass "Git installiert: $GIT_VERSION"
    
    # Git config
    if git config user.name &> /dev/null && git config user.email &> /dev/null; then
        GIT_NAME=$(git config user.name)
        GIT_EMAIL=$(git config user.email)
        check_pass "Git konfiguriert: $GIT_NAME <$GIT_EMAIL>"
    else
        check_warn "Git nicht konfiguriert (optional, aber empfohlen für Commits)"
    fi
else
    check_warn "Git nicht gefunden (optional, aber empfohlen)"
fi
echo ""

# 7. App.json
echo "7️⃣  Checking app.json..."
if [ -f "app.json" ]; then
    check_pass "app.json vorhanden"
    
    # Validate JSON
    if node -e "require('./app.json')" &> /dev/null; then
        check_pass "app.json ist valides JSON"
        
        # Check for projectId
        if node -e "const app = require('./app.json'); if (!app.expo.extra?.eas?.projectId) process.exit(1)" &> /dev/null; then
            check_pass "EAS projectId in app.json vorhanden"
        else
            check_warn "EAS projectId fehlt (wird von 'eas init' erstellt)"
        fi
    else
        check_fail "app.json ist kein valides JSON!"
    fi
else
    check_fail "app.json nicht gefunden!"
fi
echo ""

# 8. Assets (Icons & Splash)
echo "8️⃣  Checking Assets..."
if [ -f "assets/icon.png" ]; then
    check_pass "Icon vorhanden: assets/icon.png"
else
    check_fail "Icon fehlt: assets/icon.png"
fi

if [ -f "assets/adaptive-icon.png" ]; then
    check_pass "Adaptive Icon vorhanden: assets/adaptive-icon.png"
else
    check_fail "Adaptive Icon fehlt: assets/adaptive-icon.png"
fi

if [ -f "assets/splash.png" ]; then
    check_pass "Splash Screen vorhanden: assets/splash.png"
else
    check_fail "Splash Screen fehlt: assets/splash.png"
fi
echo ""

# 9. EAS config
echo "9️⃣  Checking EAS config..."
if [ -f "eas.json" ]; then
    check_pass "eas.json vorhanden"
    
    # Validate JSON
    if node -e "require('./eas.json')" &> /dev/null; then
        check_pass "eas.json ist valides JSON"
    else
        check_fail "eas.json ist kein valides JSON!"
    fi
else
    check_fail "eas.json nicht gefunden!"
fi
echo ""

# 10. TypeScript
echo "🔟 Checking TypeScript..."
if [ -f "tsconfig.json" ]; then
    check_pass "tsconfig.json vorhanden"
else
    check_warn "tsconfig.json nicht gefunden"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Zusammenfassung:"
echo ""
echo -e "${GREEN}✓ Bestanden:${NC} $PASSED"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warnungen:${NC} $WARNINGS"
fi
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}✗ Fehlgeschlagen:${NC} $FAILED"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Setup ist bereit!${NC}"
    echo ""
    echo "Nächste Schritte:"
    echo "1. EAS Login:        cd apps/mobile && eas login"
    echo "2. EAS Init:         eas init"
    echo "3. Development Build: eas build --platform android --profile development"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Es gibt Probleme mit dem Setup.${NC}"
    echo ""
    echo "Bitte behebe die fehlgeschlagenen Checks (rot markiert) und führe das Skript erneut aus."
    echo ""
    exit 1
fi
