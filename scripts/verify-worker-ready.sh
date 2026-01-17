#!/bin/bash

# Vérification de la configuration avant déploiement Workers
echo "🔍 Vérification de la configuration pour Cloudflare Workers..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# 1. Vérifier que wrangler est installé
echo "📦 Vérification des outils..."
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ wrangler n'est pas installé${NC}"
    echo "   Installez avec: npm install -g wrangler"
    ((errors++))
else
    echo -e "${GREEN}✅ wrangler installé${NC}"
fi

# 2. Vérifier wrangler.toml
echo ""
echo "📄 Vérification de wrangler.toml..."
if [ ! -f "wrangler.toml" ]; then
    echo -e "${RED}❌ wrangler.toml introuvable${NC}"
    ((errors++))
else
    echo -e "${GREEN}✅ wrangler.toml présent${NC}"
    
    # Vérifier le binding D1
    if grep -q 'binding = "DB"' wrangler.toml; then
        echo -e "${GREEN}✅ Binding D1 configuré${NC}"
    else
        echo -e "${RED}❌ Binding D1 manquant dans wrangler.toml${NC}"
        ((errors++))
    fi
    
    # Vérifier nodejs_compat
    if grep -q 'nodejs_compat' wrangler.toml; then
        echo -e "${GREEN}✅ nodejs_compat activé${NC}"
    else
        echo -e "${YELLOW}⚠️  nodejs_compat non activé (peut causer des problèmes)${NC}"
        ((warnings++))
    fi
fi

# 3. Vérifier les secrets
echo ""
echo "🔐 Vérification des secrets..."
secrets_output=$(wrangler secret list 2>&1)
if echo "$secrets_output" | grep -q "AUTH_SECRET"; then
    echo -e "${GREEN}✅ AUTH_SECRET configuré${NC}"
else
    echo -e "${RED}❌ AUTH_SECRET manquant${NC}"
    echo "   Configurez avec: wrangler secret put AUTH_SECRET"
    ((errors++))
fi

if echo "$secrets_output" | grep -q "AUTH_URL"; then
    echo -e "${GREEN}✅ AUTH_URL configuré${NC}"
else
    echo -e "${RED}❌ AUTH_URL manquant${NC}"
    echo "   Configurez avec: wrangler secret put AUTH_URL"
    ((errors++))
fi

if echo "$secrets_output" | grep -q "GOOGLE_CLIENT_ID"; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_ID configuré${NC}"
else
    echo -e "${RED}❌ GOOGLE_CLIENT_ID manquant${NC}"
    echo "   Configurez avec: wrangler secret put GOOGLE_CLIENT_ID"
    ((errors++))
fi

if echo "$secrets_output" | grep -q "GOOGLE_CLIENT_SECRET"; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET configuré${NC}"
else
    echo -e "${RED}❌ GOOGLE_CLIENT_SECRET manquant${NC}"
    echo "   Configurez avec: wrangler secret put GOOGLE_CLIENT_SECRET"
    ((errors++))
fi

# 4. Vérifier la base de données D1
echo ""
echo "🗄️  Vérification de la base de données D1..."
if wrangler d1 list 2>&1 | grep -q "miniorg-production"; then
    echo -e "${GREEN}✅ Base de données miniorg-production existe${NC}"
else
    echo -e "${RED}❌ Base de données miniorg-production introuvable${NC}"
    echo "   Créez-la avec: wrangler d1 create miniorg-production"
    ((errors++))
fi

# 5. Vérifier les fichiers critiques
echo ""
echo "📁 Vérification des fichiers..."
critical_files=(
    "lib/auth.ts"
    "app/api/auth/[...nextauth]/route.ts"
    "prisma/schema.prisma"
    "next.config.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        ((errors++))
    fi
done

# 6. Vérifier que JWT est activé dans auth.ts
echo ""
echo "🔑 Vérification de la configuration JWT..."
if grep -q 'strategy: "jwt"' lib/auth.ts; then
    echo -e "${GREEN}✅ JWT sessions activées${NC}"
else
    echo -e "${RED}❌ JWT sessions non activées${NC}"
    echo "   Vérifiez lib/auth.ts"
    ((errors++))
fi

# 7. Vérifier que PrismaAdapter n'est plus utilisé
if grep -q 'PrismaAdapter' lib/auth.ts; then
    echo -e "${RED}❌ PrismaAdapter encore présent dans lib/auth.ts${NC}"
    echo "   PrismaAdapter ne fonctionne pas avec Workers!"
    ((errors++))
else
    echo -e "${GREEN}✅ PrismaAdapter retiré${NC}"
fi

# 8. Vérifier que runtime nodejs n'est pas forcé
if grep -q "runtime = 'nodejs'" app/api/auth/\[...nextauth\]/route.ts; then
    echo -e "${RED}❌ runtime = 'nodejs' encore présent${NC}"
    echo "   Cela cause des erreurs dans Workers!"
    ((errors++))
else
    echo -e "${GREEN}✅ runtime nodejs non forcé${NC}"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ Tout est prêt pour le déploiement !${NC}"
    echo ""
    echo "Commandes de déploiement :"
    echo "  npm run build:worker"
    echo "  npm run deploy"
    echo ""
    echo "Ou en une ligne :"
    echo "  npm run build:worker && npm run deploy"
    exit 0
else
    echo -e "${RED}❌ $errors erreur(s) trouvée(s)${NC}"
    if [ $warnings -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $warnings avertissement(s)${NC}"
    fi
    echo ""
    echo "Corrigez les erreurs avant de déployer."
    exit 1
fi
