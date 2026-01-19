# Toast Completion Feature

## Description

Ce document décrit l'implémentation d'une fonctionnalité de notifications toast lors de la complétion de tâches et d'événements dans MiniOrg.

## Architecture

### Store Centralisé (`lib/stores/task-store.ts`)

Un nouveau store singleton a été créé pour centraliser toute la logique liée aux actions sur les tâches et événements :

#### Méthodes principales

1. **`toggleTaskComplete(taskId, completed, options)`**
   - Gère la complétion/décomplétion d'une tâche
   - Affiche un toast de succès par défaut
   - Émet un événement de mise à jour pour synchroniser les composants
   - Options configurables pour personnaliser les messages

2. **`toggleEventComplete(eventId, completed, options)`**
   - Gère la complétion/décomplétion d'un événement
   - Détecte automatiquement si c'est un événement externe ou lié à une tâche
   - Affiche des messages différents selon le contexte :
     - "Event completed successfully" pour une complétion normale
     - "Event completed and imported" quand un événement externe est auto-importé
   - Retourne l'événement mis à jour pour synchronisation locale

3. **`deleteTask(taskId, options)`**
   - Gère la suppression d'une tâche
   - Affiche un toast de confirmation
   - Émet un événement de mise à jour

### Avantages de cette Architecture

1. **Centralisation** : Un seul endroit pour modifier la logique de complétion/suppression
2. **Réutilisabilité** : Le store peut être utilisé par n'importe quel composant
3. **Cohérence** : Tous les toasts suivent le même format
4. **Maintenabilité** : Facile d'ajouter de nouvelles fonctionnalités ou de modifier les messages
5. **Configuration** : Messages personnalisables via options

## Composants Modifiés

### 1. `components/backlog/backlog-content.tsx`
- Remplace la logique de complétion locale par l'utilisation du store
- Simplifie `handleToggleComplete` et `handleDelete`
- Code réduit de ~40 lignes

### 2. `components/calendar/event-detail-dialog.tsx`
- Utilise le store pour la complétion d'événements
- Simplifie `handleCheckboxChange`
- Gestion automatique des messages selon le contexte
- Code réduit de ~30 lignes

### 3. `app/(dashboard)/calendar/page.tsx`
- Utilise le store pour les tâches du calendrier
- Simplifie `handleToggleComplete` et `handleDelete`
- Cohérence avec les autres vues

## Corrections Supplémentaires

### 1. `lib/services/api-client.ts`
- Correction du chemin d'import : `@/providers/toast` → `@/lib/hooks/use-toast`

### 2. `components/ui/sonner.tsx`
- Correction de l'import d'icône : `OctagonXIcon` → `XCircleIcon`
- L'icône `OctagonXIcon` n'existe pas dans lucide-react

## Système de Toast (Sonner)

Le projet utilise déjà Sonner pour les notifications toast :
- Configuration dans `components/ui/sonner.tsx`
- Intégré dans `app/layout.tsx`
- Hook personnalisé `useToast` dans `lib/hooks/use-toast.ts`

## Messages Toast Affichés

### Tâches
- ✅ **Complétion** : "Task completed successfully"
- ⬜ **Décomplétion** : "Task marked as incomplete"
- 🗑️ **Suppression** : "Task deleted successfully"
- ❌ **Erreur** : "Failed to update task" / "Failed to delete task"

### Événements
- ✅ **Complétion normale** : "Event completed successfully"
- ⬜ **Décomplétion** : "Event marked as incomplete"
- 📥 **Auto-import** : "Event completed and imported" avec description "A new task has been created and marked as done"
- ❌ **Erreur** : "Failed to update event"

## Utilisation

```typescript
import { taskStore } from "@/lib/stores/task-store";

// Compléter une tâche avec toast
const success = await taskStore.toggleTaskComplete(taskId, true);

// Compléter une tâche sans toast
const success = await taskStore.toggleTaskComplete(taskId, true, {
  showToast: false
});

// Compléter avec message personnalisé
const success = await taskStore.toggleTaskComplete(taskId, true, {
  successMessage: "Great job!",
  errorMessage: "Oops, something went wrong"
});

// Compléter un événement
const result = await taskStore.toggleEventComplete(eventId, true, {
  isExternal: false,
  hasTaskId: true
});
```

## Tests

Pour tester la fonctionnalité :

1. **Backlog** : Cocher/décocher une tâche → Toast apparaît
2. **Calendar** : Cocher/décocher une tâche dans le calendrier → Toast apparaît
3. **Timeline** : Ouvrir un événement et le cocher → Toast apparaît avec message adapté
4. **External Events** : Cocher un événement Google Calendar → Toast "imported"
5. **Delete** : Supprimer une tâche → Toast de confirmation

## Prochaines Étapes Possibles

1. Ajouter des toasts pour la création de tâches
2. Ajouter des toasts pour la modification de tâches
3. Ajouter des actions "Undo" dans les toasts
4. Personnaliser les durées d'affichage des toasts
5. Ajouter des sons de notification (optionnel)
