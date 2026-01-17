#!/bin/bash

# Script pour réinitialiser la base D1 DISTANTE (production sur Cloudflare)
# ⚠️  ATTENTION: Ce script affecte la BASE DE PRODUCTION sur Cloudflare

set -e

echo "🔄 Réinitialisation de la base D1 DISTANTE (Cloudflare)"
echo "========================================================="
echo ""

# Nom de la base (depuis wrangler.toml)
DB_NAME="miniorg-production"

echo "⚠️  AVERTISSEMENT CRITIQUE:"
echo "Ce script va affecter la BASE DE PRODUCTION sur Cloudflare:"
echo "  1. Supprimer TOUTES les tables existantes"
echo "  2. Supprimer TOUTES les données de PRODUCTION"
echo "  3. Recréer le schéma from scratch"
echo ""
echo "🌍 Base cible: $DB_NAME (REMOTE - Cloudflare)"
echo ""
read -p "Tapez 'PRODUCTION' pour confirmer: " confirm

if [ "$confirm" != "PRODUCTION" ]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "================================================"
echo "ÉTAPE 1/2: Nettoyage de la base DISTANTE"
echo "================================================"

# Liste des tables à supprimer
TABLES=(
    "_TaskTags"
    "CalendarEvent"
    "Task"
    "Tag"
    "Session"
    "Account"
    "VerificationToken"
    "User"
    "_prisma_migrations"
)

for table in "${TABLES[@]}"; do
    echo "  🗑️  Suppression de $table..."
    wrangler d1 execute $DB_NAME --remote --command="DROP TABLE IF EXISTS \"$table\";" 2>/dev/null || true
done

echo ""
echo "✅ Nettoyage terminé"

echo ""
echo "================================================"
echo "ÉTAPE 2/2: Application du nouveau schéma"
echo "================================================"

# Vérifier que le fichier de schéma existe
if [ ! -f "./prisma/d1-schema.sql" ]; then
    echo "❌ Erreur: Le fichier prisma/d1-schema.sql n'existe pas"
    exit 1
fi

echo "📦 Application du schéma complet sur Cloudflare..."
wrangler d1 execute $DB_NAME --remote --file=./prisma/d1-schema.sql

echo ""
echo "✅ Schéma appliqué avec succès!"

echo ""
echo "================================================"
echo "Vérification finale"
echo "================================================"

echo ""
echo "📊 Tables créées sur Cloudflare:"
wrangler d1 execute $DB_NAME --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo "🎉 Base de données de PRODUCTION réinitialisée!"
echo ""
echo "⚠️  N'oubliez pas:"
echo "  - Les utilisateurs devront se reconnecter"
echo "  - Toutes les données précédentes sont perdues"
echo "  - Testez l'application immédiatement"
