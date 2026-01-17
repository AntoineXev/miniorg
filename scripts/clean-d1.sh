#!/bin/bash

# Script pour nettoyer complètement la base D1
# ⚠️  ATTENTION: Ce script supprime TOUTES les données de la base

echo "🗑️  Nettoyage de la base D1..."

# Nom de la base (depuis wrangler.toml)
DB_NAME="miniorg-production"

# Liste des tables à supprimer (dans l'ordre pour respecter les foreign keys)
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

echo "📋 Tables à supprimer: ${TABLES[@]}"
echo ""
read -p "⚠️  Êtes-vous sûr de vouloir supprimer TOUTES les données ? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "🔥 Suppression des tables en cours..."

for table in "${TABLES[@]}"; do
    echo "  - Suppression de $table..."
    wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS \"$table\";" 2>/dev/null || true
done

echo ""
echo "✅ Base de données nettoyée!"
echo ""
echo "📊 Tables restantes (devrait être vide):"
wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
