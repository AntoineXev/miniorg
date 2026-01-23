# 🎨 Architecture des Styles Spécifiques à la Plateforme

Une architecture propre et prête à l'emploi pour gérer les styles CSS différents entre Tauri (desktop) et Web.

## 🚀 Démarrage Rapide

### 1. Ajouter des styles CSS pour Tauri

Éditez `app/tauri.css` et ajoutez vos styles préfixés par `.platform-tauri` :

```css
/* Exemple : Modifier le style d'un composant sur Tauri */
.platform-tauri .my-component {
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

### 2. Utiliser le hook dans un composant

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function MyComponent() {
  const { isTauri, isWeb } = usePlatform();
  
  return (
    <div className={isTauri ? 'desktop-style' : 'web-style'}>
      {isTauri && <div>Feature exclusive à desktop</div>}
      {isWeb && <div>Feature exclusive au web</div>}
    </div>
  );
}
```

### 3. Classes CSS automatiques

Le système ajoute automatiquement ces classes sur le `<body>` :
- ✅ `platform-tauri` : L'app tourne sur Tauri
- ✅ `platform-web` : L'app tourne sur le Web
- ✅ `platform-ready` : La détection est terminée

## 📁 Structure des Fichiers

```
app/
  ├── globals.css           # Styles communs à toutes les plateformes
  └── tauri.css            # Styles spécifiques à Tauri UNIQUEMENT

providers/
  └── platform-provider.tsx # Provider qui détecte la plateforme

lib/
  ├── platform.ts          # Utilitaires de détection
  └── hooks/
      └── use-platform.ts  # Hook React pour accéder à la plateforme

components/examples/
  └── platform-aware-button.tsx # Exemple de composant adaptatif

docs/
  └── PLATFORM_STYLES.md   # Documentation complète avec exemples
```

## 🎯 Cas d'Usage Courants

### Zone Draggable pour la Fenêtre

```tsx
<header className="tauri-drag-region">
  <h1>Mon App</h1>
  <button>Menu</button> {/* Automatiquement non-draggable */}
</header>
```

### Styles Conditionnels avec Tailwind

```tsx
const { isTauri } = usePlatform();

<div className={`
  rounded-lg
  ${isTauri ? 'backdrop-blur-xl shadow-2xl' : 'shadow-md'}
`}>
  Contenu
</div>
```

### Comportement Différent par Plateforme

```tsx
const { isTauri } = usePlatform();

if (isTauri) {
  // Utiliser les notifications natives
  await invoke('show_notification', { message });
} else {
  // Utiliser l'API Web
  new Notification(message);
}
```

## 🎨 Fonctionnalités Intégrées

- ✅ **Zone draggable** : Déplacer la fenêtre facilement
- ✅ **Scrollbars personnalisées** : Style natif sur desktop
- ✅ **Sélection de texte** : Contrôle fin de la sélection
- ✅ **Raccourcis clavier visuels** : Classes pour afficher ⌘K, etc.
- ✅ **Variables CSS** : Personnalisables par plateforme
- ✅ **Animations optimisées** : Plus fluides sur desktop

## 📖 Documentation Complète

Voir `docs/PLATFORM_STYLES.md` pour :
- Guide détaillé d'utilisation
- Exemples pratiques
- Bonnes pratiques
- Guide de débogage

## 🔧 Personnalisation

### Ajouter des Variables CSS

Dans `app/tauri.css` :

```css
.platform-tauri {
  --sidebar-width: 280px;
  --header-height: 64px;
  --animation-speed: 200ms;
}
```

Utiliser dans vos composants :

```tsx
<div style={{ width: 'var(--sidebar-width)' }}>
  Sidebar
</div>
```

## ✅ Exemple Complet

Voir `components/examples/platform-aware-button.tsx` pour un exemple de composant qui :
- Utilise le hook `usePlatform()`
- Applique des styles conditionnels
- Affiche un indicateur visuel en mode dev

## 🐛 Débogage

Vérifier la détection dans la console :

```javascript
// La plateforme détectée
document.body.classList.contains('platform-tauri') // true sur Tauri
document.body.classList.contains('platform-web')   // true sur Web

// Via le provider
const { isTauri, isWeb, isReady } = usePlatform();
console.log({ isTauri, isWeb, isReady });
```

## 🎉 C'est Prêt !

L'architecture est déjà intégrée dans le layout principal. Commencez simplement à ajouter vos styles dans `app/tauri.css` et utilisez le hook `usePlatform()` dans vos composants !

---

**Questions ?** Consultez `docs/PLATFORM_STYLES.md` pour plus de détails.
