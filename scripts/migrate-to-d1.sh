#!/bin/bash

# Script pour migrer la base de données SQLite vers D1
# Usage: ./scripts/migrate-to-d1.sh [database_name]

DATABASE_NAME=${1:-miniorg-production}

echo "🚀 Migration de la base de données vers D1: $DATABASE_NAME"
echo ""

# Étape 1: Générer le SQL combiné depuis les migrations Prisma
echo "📝 Génération du SQL depuis les migrations Prisma..."
cat prisma/migrations/*/migration.sql > prisma/combined-migration.sql

# Étape 2: Exécuter les migrations sur D1
echo "⚡ Exécution des migrations sur D1..."
wrangler d1 execute $DATABASE_NAME --file=prisma/combined-migration.sql

# Étape 3: Export des données existantes (optionnel)
if [ -f "prisma/dev.db" ]; then
    echo ""
    read -p "💾 Voulez-vous exporter les données de dev.db vers D1? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📤 Export des données..."
        sqlite3 prisma/dev.db .dump > prisma/data-export.sql
        
        echo "📥 Import des données dans D1..."
        wrangler d1 execute $DATABASE_NAME --file=prisma/data-export.sql
        
        echo "✅ Données importées avec succès!"
    fi
fi

echo ""
echo "✅ Migration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Récupérez le database_id avec: wrangler d1 list"
echo "2. Mettez à jour wrangler.toml avec le database_id"
echo "3. Configurez les secrets avec: wrangler secret put AUTH_SECRET, etc."
echo "4. Testez localement avec: npm run build && npm run preview"
