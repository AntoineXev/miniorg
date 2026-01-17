#!/bin/bash

# NextAuth Migration Verification Script
# Vérifie que la migration de better-auth vers NextAuth est complète

echo "🔍 Vérification de la migration NextAuth..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# 1. Vérifier qu'il n'y a plus de références à better-auth dans le code
echo "1️⃣  Vérification des références better-auth..."
if grep -r "better-auth" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.next . > /dev/null 2>&1; then
  echo -e "${RED}❌ Références à better-auth trouvées dans le code${NC}"
  grep -r "better-auth" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.next .
  errors=$((errors + 1))
else
  echo -e "${GREEN}✅ Pas de références better-auth dans le code${NC}"
fi
echo ""

# 2. Vérifier que lib/auth-server.ts n'existe plus
echo "2️⃣  Vérification des anciens fichiers..."
if [ -f "lib/auth-server.ts" ]; then
  echo -e "${RED}❌ lib/auth-server.ts existe encore${NC}"
  errors=$((errors + 1))
else
  echo -e "${GREEN}✅ Anciens fichiers supprimés${NC}"
fi
echo ""

# 3. Vérifier que les fichiers NextAuth existent
echo "3️⃣  Vérification des fichiers NextAuth..."
required_files=(
  "lib/auth.ts"
  "lib/auth-client.ts"
  "app/api/auth/[...nextauth]/route.ts"
  "types/next-auth.d.ts"
  "components/providers/session-provider.tsx"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file${NC}"
  else
    echo -e "${RED}❌ $file manquant${NC}"
    errors=$((errors + 1))
  fi
done
echo ""

# 4. Vérifier trustHost dans lib/auth.ts
echo "4️⃣  Vérification de trustHost..."
if grep -q "trustHost.*true" lib/auth.ts; then
  echo -e "${GREEN}✅ trustHost configuré${NC}"
else
  echo -e "${YELLOW}⚠️  trustHost non configuré (nécessaire pour Cloudflare Workers)${NC}"
  warnings=$((warnings + 1))
fi
echo ""

# 5. Vérifier SessionProvider dans app/layout.tsx
echo "5️⃣  Vérification du SessionProvider..."
if grep -q "SessionProvider\|Providers" app/layout.tsx; then
  echo -e "${GREEN}✅ SessionProvider configuré${NC}"
else
  echo -e "${RED}❌ SessionProvider manquant dans app/layout.tsx${NC}"
  errors=$((errors + 1))
fi
echo ""

# 6. Vérifier les variables d'environnement dans .env.example
echo "6️⃣  Vérification des variables d'environnement..."
required_vars=("AUTH_SECRET" "AUTH_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
for var in "${required_vars[@]}"; do
  if grep -q "$var" env.example; then
    echo -e "${GREEN}✅ $var documenté${NC}"
  else
    echo -e "${RED}❌ $var manquant dans env.example${NC}"
    errors=$((errors + 1))
  fi
done
echo ""

# 7. Vérifier qu'il n'y a pas de export const runtime = 'edge'
echo "7️⃣  Vérification du runtime (pas besoin pour Workers)..."
if grep -r "export const runtime.*=.*['\"]edge['\"]" app/api --include="*.ts" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  export const runtime = 'edge' trouvé (pas nécessaire avec OpenNext)${NC}"
  grep -r "export const runtime.*=.*['\"]edge['\"]" app/api --include="*.ts"
  warnings=$((warnings + 1))
else
  echo -e "${GREEN}✅ Pas de runtime edge explicite${NC}"
fi
echo ""

# 8. Vérifier le schéma Prisma
echo "8️⃣  Vérification du schéma Prisma..."
prisma_models=("User" "Account" "Session" "VerificationToken")
for model in "${prisma_models[@]}"; do
  if grep -q "model $model" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Model $model présent${NC}"
  else
    echo -e "${RED}❌ Model $model manquant${NC}"
    errors=$((errors + 1))
  fi
done
echo ""

# 9. Vérifier middleware
echo "9️⃣  Vérification du middleware..."
if [ -f "middleware.ts" ]; then
  if grep -q "auth(" middleware.ts; then
    echo -e "${GREEN}✅ Middleware utilise NextAuth${NC}"
  else
    echo -e "${RED}❌ Middleware n'utilise pas NextAuth auth()${NC}"
    errors=$((errors + 1))
  fi
else
  echo -e "${RED}❌ middleware.ts manquant${NC}"
  errors=$((errors + 1))
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
  echo -e "${GREEN}🎉 MIGRATION COMPLÈTE ET ROBUSTE !${NC}"
  echo ""
  echo "Votre configuration NextAuth est prête pour la production."
  exit 0
elif [ $errors -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Migration OK avec $warnings avertissement(s)${NC}"
  echo ""
  echo "La migration est fonctionnelle mais peut être améliorée."
  exit 0
else
  echo -e "${RED}❌ $errors erreur(s), $warnings avertissement(s)${NC}"
  echo ""
  echo "Veuillez corriger les erreurs avant de déployer."
  exit 1
fi
