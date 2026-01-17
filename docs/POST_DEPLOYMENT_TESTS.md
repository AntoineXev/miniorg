# Checklist de tests post-déploiement

Utilisez cette checklist pour valider que votre déploiement fonctionne correctement.

## 🔐 Authentification

### Test 1 : Connexion Google OAuth
- [ ] Visitez `https://miniorg.pages.dev` (ou votre domaine)
- [ ] Cliquez sur "Sign in with Google"
- [ ] L'écran de consentement Google s'affiche
- [ ] Après autorisation, vous êtes redirigé vers l'application
- [ ] Votre nom et email apparaissent dans le header

**Si ça échoue** :
- Vérifiez les redirect URIs dans Google Console
- Vérifiez `NEXTAUTH_URL` dans les secrets Cloudflare
- Consultez les logs : `wrangler pages deployment tail`

### Test 2 : Session persistante
- [ ] Rafraîchissez la page (F5)
- [ ] Vous restez connecté
- [ ] Fermez l'onglet et rouvrez
- [ ] Vous restez connecté

## 📝 Tasks CRUD

### Test 3 : Créer une tâche
- [ ] Ouvrez Quick Add (⌘K ou Ctrl+K)
- [ ] Tapez "Test task from production"
- [ ] Appuyez sur Enter
- [ ] La tâche apparaît dans le Backlog
- [ ] Vérifiez la base D1 :
```bash
wrangler d1 execute miniorg-production --command="SELECT * FROM Task ORDER BY createdAt DESC LIMIT 1"
```

### Test 4 : Modifier une tâche
- [ ] Cliquez sur une tâche
- [ ] Modifiez le titre
- [ ] Ajoutez une description
- [ ] Sauvegardez
- [ ] Les changements sont persistés (rafraîchissez la page)

### Test 5 : Supprimer une tâche
- [ ] Ouvrez une tâche
- [ ] Cliquez sur "Delete"
- [ ] Confirmez
- [ ] La tâche disparaît
- [ ] Vérifiez qu'elle n'est plus dans la DB

### Test 6 : Compléter une tâche
- [ ] Cochez la checkbox d'une tâche
- [ ] L'animation de complétion s'affiche
- [ ] La tâche passe en état "done"
- [ ] `completedAt` est défini dans la DB

## 🏷️ Tags

### Test 7 : Créer un tag
- [ ] Créez une nouvelle tâche
- [ ] Ajoutez un tag "Production Test"
- [ ] Choisissez une couleur
- [ ] Le tag apparaît sur la tâche

### Test 8 : Filtrer par tag
- [ ] Créez plusieurs tâches avec différents tags
- [ ] Filtrez par un tag spécifique
- [ ] Seules les tâches avec ce tag s'affichent

## 📅 Calendrier

### Test 9 : Créer un événement calendrier
- [ ] Allez dans l'onglet Calendar
- [ ] Créez un nouvel événement
- [ ] Définissez titre, date/heure de début et fin
- [ ] Sauvegardez
- [ ] L'événement apparaît dans le calendrier

### Test 10 : Lier une tâche à un événement
- [ ] Créez un événement
- [ ] Liez-le à une tâche existante
- [ ] L'événement affiche les informations de la tâche
- [ ] Les tags de la tâche apparaissent sur l'événement

### Test 11 : Modifier un événement
- [ ] Cliquez sur un événement dans le calendrier
- [ ] Modifiez le titre et l'heure
- [ ] Sauvegardez
- [ ] Les changements sont visibles immédiatement

## 🖱️ Drag & Drop

### Test 12 : Drag & drop de tâches
- [ ] Dans Calendar view, glissez une tâche incomplète
- [ ] Déposez-la sur un autre jour
- [ ] La `scheduledDate` de la tâche est mise à jour
- [ ] Rafraîchissez : la tâche reste sur le nouveau jour

### Test 13 : Drag & drop de tâches complétées
- [ ] Essayez de glisser une tâche complétée
- [ ] Elle ne devrait pas être draggable
- [ ] Les tâches complétées restent fixes

## ⚡ Performance

### Test 14 : Latence Edge
- [ ] Ouvrez DevTools (F12) > Network
- [ ] Rechargez la page
- [ ] Vérifiez les temps de réponse des API :
  - GET /api/tasks : < 200ms
  - GET /api/tags : < 150ms
  - GET /api/calendar-events : < 200ms

### Test 15 : Cold start
- [ ] Attendez 5-10 minutes sans activité
- [ ] Rafraîchissez la page
- [ ] Premier chargement (cold start) : < 1s
- [ ] Chargements suivants : < 300ms

## 🌐 Multi-utilisateurs

### Test 16 : Isolation des données
- [ ] Connectez-vous avec le compte A
- [ ] Créez quelques tâches
- [ ] Déconnectez-vous
- [ ] Connectez-vous avec le compte B
- [ ] Aucune tâche du compte A n'est visible
- [ ] Créez des tâches pour le compte B
- [ ] Reconnectez-vous avec A : seules les tâches A sont visibles

## 🔍 Base de données D1

### Test 17 : Intégrité des données
Vérifiez la structure de la base :
```bash
# Compter les utilisateurs
wrangler d1 execute miniorg-production --command="SELECT COUNT(*) as count FROM User"

# Compter les tâches
wrangler d1 execute miniorg-production --command="SELECT COUNT(*) as count FROM Task"

# Compter les événements
wrangler d1 execute miniorg-production --command="SELECT COUNT(*) as count FROM CalendarEvent"

# Vérifier les relations
wrangler d1 execute miniorg-production --command="SELECT t.title, GROUP_CONCAT(tg.name) as tags FROM Task t LEFT JOIN _TaskTags tt ON t.id = tt.A LEFT JOIN Tag tg ON tt.B = tg.id GROUP BY t.id LIMIT 5"
```

### Test 18 : Transactions
- [ ] Créez une tâche avec plusieurs tags
- [ ] Vérifiez que la relation many-to-many est correcte :
```bash
wrangler d1 execute miniorg-production --command="SELECT * FROM _TaskTags LIMIT 10"
```

## 📊 Logs et monitoring

### Test 19 : Logs en temps réel
```bash
wrangler pages deployment tail
```
- [ ] Effectuez quelques actions dans l'app
- [ ] Les logs s'affichent en temps réel
- [ ] Aucune erreur dans les logs

### Test 20 : Analytics Cloudflare
- [ ] Allez sur Dashboard Cloudflare > Pages > miniorg
- [ ] Vérifiez les analytics :
  - Nombre de requêtes
  - Temps de réponse moyen
  - Taux d'erreur (devrait être 0%)

## 🔒 Sécurité

### Test 21 : Protection des routes
- [ ] Ouvrez un onglet privé
- [ ] Essayez d'accéder à `/backlog` sans être connecté
- [ ] Vous êtes redirigé vers `/login`
- [ ] Essayez d'appeler `/api/tasks` sans authentification
- [ ] Vous recevez une erreur 401 Unauthorized

### Test 22 : Protection des données
```bash
# Tentative de lecture des tâches d'un autre utilisateur
# (devrait retourner vide ou erreur)
wrangler d1 execute miniorg-production --command="SELECT * FROM Task WHERE userId = 'USER_ID_QUI_N_EST_PAS_LE_VOTRE'"
```

## 🌍 Domaine custom (si configuré)

### Test 23 : Domaine custom
- [ ] Visitez votre domaine custom
- [ ] Le site se charge correctement
- [ ] HTTPS est actif (cadenas dans l'URL)
- [ ] Certificat SSL est valide
- [ ] L'authentification Google fonctionne

### Test 24 : Redirect URIs multiples
Si vous avez à la fois `.pages.dev` et un domaine custom :
- [ ] Authentification fonctionne sur `.pages.dev`
- [ ] Authentification fonctionne sur le domaine custom
- [ ] Les deux URIs sont dans Google Console

## 📱 Responsive

### Test 25 : Mobile
- [ ] Ouvrez l'app sur mobile (ou DevTools responsive mode)
- [ ] Le layout s'adapte
- [ ] La navigation fonctionne
- [ ] Le drag & drop fonctionne sur tactile
- [ ] Quick Add s'ouvre avec le raccourci

## ✅ Résumé

Une fois tous les tests passés :

```
✅ Authentification : ___ / 2
✅ Tasks CRUD : ___ / 4
✅ Tags : ___ / 2
✅ Calendrier : ___ / 3
✅ Drag & Drop : ___ / 2
✅ Performance : ___ / 2
✅ Multi-utilisateurs : ___ / 1
✅ Base de données : ___ / 2
✅ Logs : ___ / 2
✅ Sécurité : ___ / 2
✅ Domaine custom : ___ / 2 (optionnel)
✅ Responsive : ___ / 1

TOTAL : ___ / 25 (23 minimum sans domaine custom)
```

## 🐛 Dépannage

Si un test échoue :

1. **Consultez les logs** :
```bash
wrangler pages deployment tail
```

2. **Vérifiez les secrets** :
```bash
wrangler secret list
```

3. **Vérifiez la config D1** :
- Binding `DB` est bien configuré dans le dashboard
- `database_id` est correct dans `wrangler.toml`

4. **Vérifiez les variables d'environnement** :
- `NEXTAUTH_URL` correspond à l'URL de déploiement
- `NEXTAUTH_SECRET` est défini
- Google credentials sont corrects

5. **Rollback si nécessaire** :
```bash
# Liste des déploiements
wrangler pages deployment list --project-name=miniorg

# Rollback vers un déploiement précédent
wrangler pages deployment rollback [DEPLOYMENT_ID]
```

## 📝 Notes

- Testez après chaque déploiement
- Gardez une trace des tests qui échouent
- Les cold starts sont normaux (< 1s)
- La latence Edge devrait être < 200ms dans la plupart des cas
