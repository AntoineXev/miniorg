#!/bin/bash

# Script de vérification pré-déploiement
# Ce script vérifie que tout est prêt pour le déploiement sur Cloudflare

echo "🔍 Vérification de la configuration pour le déploiement Cloudflare..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

# Fonction pour afficher OK
ok() {
    echo -e "${GREEN}✓${NC} $1"
}

# Fonction pour afficher erreur
error() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# Fonction pour afficher warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "1️⃣  Vérification des dépendances..."

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    ok "Node.js installé: $NODE_VERSION"
else
    error "Node.js non installé"
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    ok "npm installé: $NPM_VERSION"
else
    error "npm non installé"
fi

# Vérifier Wrangler
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version)
    ok "Wrangler installé: $WRANGLER_VERSION"
else
    warning "Wrangler non installé globalement (utilisera npx)"
fi

echo ""
echo "2️⃣  Vérification des packages npm..."

# Vérifier node_modules
if [ -d "node_modules" ]; then
    ok "node_modules présent"
else
    error "node_modules manquant. Exécutez: npm install"
fi

# Vérifier packages critiques
if [ -d "node_modules/@cloudflare/next-on-pages" ]; then
    ok "@cloudflare/next-on-pages installé"
else
    error "@cloudflare/next-on-pages manquant"
fi

if [ -d "node_modules/@prisma/adapter-d1" ]; then
    ok "@prisma/adapter-d1 installé"
else
    error "@prisma/adapter-d1 manquant"
fi

echo ""
echo "3️⃣  Vérification de la configuration..."

# Vérifier wrangler.toml
if [ -f "wrangler.toml" ]; then
    ok "wrangler.toml présent"
    
    # Vérifier database_id
    if grep -q "REPLACE_WITH_YOUR_DATABASE_ID" wrangler.toml; then
        error "database_id non configuré dans wrangler.toml"
        echo "   Exécutez: wrangler d1 create miniorg-production"
        echo "   Puis mettez à jour le database_id dans wrangler.toml"
    else
        ok "database_id configuré dans wrangler.toml"
    fi
else
    error "wrangler.toml manquant"
fi

# Vérifier Prisma
if [ -f "prisma/schema.prisma" ]; then
    ok "prisma/schema.prisma présent"
else
    error "prisma/schema.prisma manquant"
fi

# Vérifier migrations
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l | xargs)
    ok "Migrations Prisma présentes ($MIGRATION_COUNT)"
else
    warning "Aucune migration Prisma trouvée"
fi

echo ""
echo "4️⃣  Vérification des fichiers critiques..."

# Vérifier fichiers créés
CRITICAL_FILES=(
    "lib/prisma-edge.ts"
    "scripts/migrate-to-d1.sh"
    "DEPLOYMENT.md"
    "docs/GOOGLE_OAUTH_SETUP.md"
    ".env.example"
    ".dev.vars.example"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        ok "$file présent"
    else
        error "$file manquant"
    fi
done

echo ""
echo "5️⃣  Vérification du code Edge Runtime..."

# Vérifier que les routes API ont runtime='edge'
API_ROUTES=(
    "app/api/tasks/route.ts"
    "app/api/tags/route.ts"
    "app/api/calendar-events/route.ts"
    "app/api/auth/[...nextauth]/route.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        if grep -q "export const runtime = 'edge'" "$route"; then
            ok "$route a runtime='edge'"
        else
            error "$route manque runtime='edge'"
        fi
    else
        warning "$route non trouvé"
    fi
done

echo ""
echo "6️⃣  Vérification TypeScript..."

# Test de compilation TypeScript
if npx tsc --noEmit &> /dev/null; then
    ok "Compilation TypeScript réussie"
else
    warning "Erreurs TypeScript détectées (vérifiez avec: npx tsc --noEmit)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests critiques sont passés !${NC}"
    echo ""
    echo "📋 Prochaines étapes pour le déploiement :"
    echo ""
    echo "1. Créer la base D1 (si pas déjà fait) :"
    echo "   wrangler d1 create miniorg-production"
    echo ""
    echo "2. Mettre à jour wrangler.toml avec le database_id"
    echo ""
    echo "3. Migrer le schéma vers D1 :"
    echo "   ./scripts/migrate-to-d1.sh miniorg-production"
    echo ""
    echo "4. Configurer les secrets :"
    echo "   wrangler secret put NEXTAUTH_SECRET"
    echo "   wrangler secret put GOOGLE_CLIENT_ID"
    echo "   wrangler secret put GOOGLE_CLIENT_SECRET"
    echo "   wrangler secret put NEXTAUTH_URL"
    echo ""
    echo "5. Tester le build :"
    echo "   npm run pages:build"
    echo ""
    echo "6. Déployer :"
    echo "   wrangler pages deploy .vercel/output/static --project-name=miniorg"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS avertissement(s) détecté(s)${NC}"
        echo ""
    fi
    
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS avertissement(s) détecté(s)${NC}"
    fi
    
    echo ""
    echo "Corrigez les erreurs ci-dessus avant de continuer."
    exit 1
fi
