#!/bin/bash

# Script pour appliquer le schéma complet à la base D1
# Ce script applique toutes les migrations en une seule fois

set -e

echo "🚀 Configuration de la base D1 avec le schéma complet..."
echo ""

# Nom de la base (depuis wrangler.toml)
DB_NAME="miniorg-production"

# Vérifier que le fichier de schéma existe
if [ ! -f "./prisma/d1-schema.sql" ]; then
    echo "❌ Erreur: Le fichier prisma/d1-schema.sql n'existe pas"
    exit 1
fi

echo "📦 Application du schéma complet..."
wrangler d1 execute $DB_NAME --file=./prisma/d1-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schéma appliqué avec succès!"
    echo ""
    echo "📊 Tables créées:"
    wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    
    echo ""
    echo "🎉 Base de données prête à l'emploi!"
else
    echo ""
    echo "❌ Erreur lors de l'application du schéma"
    exit 1
fi
