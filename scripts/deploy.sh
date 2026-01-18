#!/bin/bash

# Script de déploiement complet pour Cloudflare Workers
# Ce script construit et déploie l'application

set -e  # Exit on error

echo "🚀 Déploiement de miniorg sur Cloudflare Workers"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Étape 1: Build
echo -e "${YELLOW}📦 Étape 1/3: Build de l'application...${NC}"
npm run build:cloudflare

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Le build a échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# Étape 2: Vérification des secrets
echo -e "${YELLOW}🔑 Étape 2/3: Vérification de la configuration...${NC}"
echo ""
echo "Assurez-vous que les secrets suivants sont configurés dans Cloudflare :"
echo "  - AUTH_SECRET"
echo "  - AUTH_URL"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo ""
read -p "Les secrets sont-ils configurés ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pour configurer les secrets, utilisez :"
    echo "  wrangler secret put AUTH_SECRET"
    echo "  wrangler secret put GOOGLE_CLIENT_ID"
    echo "  wrangler secret put GOOGLE_CLIENT_SECRET"
    echo ""
    echo "Et ajoutez AUTH_URL via le dashboard Cloudflare"
    exit 1
fi

echo -e "${GREEN}✅ Configuration vérifiée${NC}"
echo ""

# Étape 3: Déploiement
echo -e "${YELLOW}🚀 Étape 3/3: Déploiement sur Cloudflare...${NC}"
npm run deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Le déploiement a échoué${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Déploiement réussi !${NC}"
echo ""
echo "📝 Prochaines étapes :"
echo "  1. Vérifier que la base D1 a le bon schéma :"
echo "     wrangler d1 execute miniorg-db --remote --command \"SELECT name FROM sqlite_master WHERE type='table';\""
echo ""
echo "  2. Si les tables n'existent pas, appliquer le schéma :"
echo "     wrangler d1 execute miniorg-db --remote --file=./prisma/d1-schema.sql"
echo ""
echo "  3. Configurer OAuth Google avec l'URL de production"
echo ""
echo "  4. Tester l'application !"
echo ""
