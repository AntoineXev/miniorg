#!/bin/bash

# Script complet pour nettoyer et recréer la base D1 from scratch
# ⚠️  ATTENTION: Ce script supprime TOUTES les données

set -e

echo "🔄 Réinitialisation complète de la base D1"
echo "=========================================="
echo ""

# Nom de la base (depuis wrangler.toml)
DB_NAME="miniorg-production"

echo "⚠️  AVERTISSEMENT:"
echo "Ce script va:"
echo "  1. Supprimer TOUTES les tables existantes"
echo "  2. Supprimer TOUTES les données"
echo "  3. Recréer le schéma from scratch"
echo ""
read -p "Êtes-vous sûr de vouloir continuer ? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "================================================"
echo "ÉTAPE 1/2: Nettoyage de la base"
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
    wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS \"$table\";" 2>/dev/null || true
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

echo "📦 Application du schéma complet..."
wrangler d1 execute $DB_NAME --file=./prisma/d1-schema.sql

echo ""
echo "✅ Schéma appliqué avec succès!"

echo ""
echo "================================================"
echo "Vérification finale"
echo "================================================"

echo ""
echo "📊 Tables créées:"
wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo "🎉 Base de données réinitialisée et prête!"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier que l'application se connecte correctement"
echo "  2. Tester la création d'un utilisateur"
echo "  3. Tester la création d'une tâche"
