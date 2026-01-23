# Architecture des Styles Spécifiques à la Plateforme

Ce document explique comment utiliser l'architecture mise en place pour gérer les styles CSS spécifiques à Tauri vs Web.

## 📋 Vue d'ensemble

L'architecture permet de :
- ✅ Détecter automatiquement si l'app tourne sur Tauri ou Web
- ✅ Appliquer des styles CSS conditionnels via des classes
- ✅ Accéder à l'état de la plateforme dans les composants React
- ✅ Garder le code organisé et maintenable

## 🏗️ Architecture

### 1. Provider de Plateforme

Le `PlatformProvider` est automatiquement intégré au layout principal et :
- Détecte la plateforme au chargement
- Ajoute les classes CSS appropriées sur le `<body>`
- Fournit un contexte React pour accéder à l'état

**Classes CSS appliquées :**
- `platform-tauri` : Ajoutée quand l'app tourne sur Tauri
- `platform-web` : Ajoutée quand l'app tourne sur le Web
- `platform-ready` : Ajoutée une fois la détection terminée

### 2. Fichiers CSS

#### `app/globals.css`
Styles globaux communs à toutes les plateformes.

#### `app/tauri.css`
Styles spécifiques à Tauri uniquement. Tous les styles sont préfixés par `.platform-tauri`.

### 3. Hook React

Le hook `usePlatform()` permet d'accéder à l'état de la plateforme dans n'importe quel composant.

## 🎯 Utilisation

### Option 1 : CSS (Recommandé)

Utilisez les classes CSS pour des ajustements visuels :

```css
/* Dans app/tauri.css */

/* Style appliqué uniquement sur Tauri */
.platform-tauri .my-component {
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

/* Style pour un élément spécifique */
.platform-tauri .sidebar {
  width: 280px; /* Plus large sur desktop */
}

/* Cibler des éléments enfants */
.platform-tauri .header button {
  padding: 0.75rem;
}
```

### Option 2 : Classes Tailwind Conditionnelles

Dans vos composants React :

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function MyComponent() {
  const { isTauri } = usePlatform();
  
  return (
    <div className={`
      base-class
      ${isTauri ? 'rounded-xl backdrop-blur' : 'rounded-lg'}
    `}>
      Mon contenu
    </div>
  );
}
```

### Option 3 : Logique Conditionnelle

Pour des comportements différents selon la plateforme :

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function MyComponent() {
  const { isTauri, isWeb, isReady } = usePlatform();
  
  if (!isReady) {
    return <div>Chargement...</div>;
  }
  
  return (
    <div>
      {isTauri && (
        <div className="tauri-drag-region">
          Zone draggable pour déplacer la fenêtre
        </div>
      )}
      
      {isWeb && (
        <button>Se connecter avec Google</button>
      )}
    </div>
  );
}
```

## 🎨 Fonctionnalités Prêtes à l'Emploi

### Zone Draggable (macOS/Windows)

Permet de déplacer la fenêtre en cliquant et glissant :

```tsx
<header className="tauri-drag-region">
  <h1>Mon App</h1>
  <button>Menu</button> {/* Automatiquement non-draggable */}
</header>
```

### Sélection de Texte

Par défaut, la sélection de texte est désactivée sur Tauri (comportement natif desktop).
Pour l'activer sur un élément spécifique :

```tsx
<div data-allow-select="true">
  Ce texte peut être sélectionné
</div>
```

### Scrollbars Personnalisées

Les scrollbars sont automatiquement stylisées sur Tauri pour correspondre au design de l'app.

### Raccourcis Clavier Visuels

Utilisez les classes utilitaires pour afficher des raccourcis :

```tsx
<div className="keyboard-shortcut">
  <span className="keyboard-key">⌘</span>
  <span className="keyboard-key">K</span>
</div>
```

## 📝 Exemples Pratiques

### Exemple 1 : Sidebar avec Styles Différents

```css
/* app/tauri.css */

.platform-tauri .sidebar {
  /* Desktop : sidebar plus large avec effet de blur */
  width: 280px;
  backdrop-filter: blur(20px);
  background: hsl(var(--background) / 0.8);
}

.platform-tauri .sidebar:hover {
  background: hsl(var(--background) / 0.9);
}
```

### Exemple 2 : Header avec Zone Draggable

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function Header() {
  const { isTauri } = usePlatform();
  
  return (
    <header 
      className={`
        h-14 flex items-center justify-between px-4
        ${isTauri ? 'tauri-drag-region' : ''}
      `}
    >
      <h1>MiniOrg</h1>
      <nav>
        <button>Settings</button>
        <button>Profile</button>
      </nav>
    </header>
  );
}
```

### Exemple 3 : Bouton avec Styles Adaptatifs

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function PrimaryButton({ children, ...props }) {
  const { isTauri } = usePlatform();
  
  return (
    <button
      className={`
        px-4 py-2 rounded font-medium
        ${isTauri 
          ? 'shadow-lg hover:shadow-xl transition-shadow' 
          : 'shadow hover:shadow-md'
        }
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Exemple 4 : Modal avec Comportement Différent

```tsx
import { usePlatform } from '@/lib/hooks/use-platform';

export function AppModal() {
  const { isTauri } = usePlatform();
  
  return (
    <div className={`
      modal
      ${isTauri 
        ? 'rounded-2xl backdrop-blur-xl' 
        : 'rounded-lg'
      }
    `}>
      <div className="modal-content">
        {/* Contenu */}
      </div>
    </div>
  );
}
```

## 🔧 Variables CSS Personnalisées

Vous pouvez aussi définir des variables CSS spécifiques à Tauri :

```css
/* app/tauri.css */

.platform-tauri {
  /* Variables spécifiques à desktop */
  --sidebar-width: 280px;
  --header-height: 56px;
  --content-max-width: 1400px;
  
  /* Ombres plus prononcées */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

Puis les utiliser dans vos composants :

```tsx
<div className="w-[var(--sidebar-width)]">
  Sidebar
</div>
```

## 🚀 Bonnes Pratiques

1. **Préférez le CSS pour les ajustements visuels** : Plus performant et plus facile à maintenir
2. **Utilisez le hook React pour la logique conditionnelle** : Quand vous avez besoin de rendu différent
3. **Groupez les styles Tauri** : Gardez tous les styles spécifiques dans `tauri.css`
4. **Testez sur les deux plateformes** : Vérifiez que l'app fonctionne bien en Web et sur Tauri
5. **Documentez les différences** : Commentez pourquoi un style est différent sur Tauri

## 🐛 Débogage

### Vérifier la Détection de Plateforme

Ouvrez la console et tapez :

```javascript
document.body.classList.contains('platform-tauri') // true sur Tauri
document.body.classList.contains('platform-web')   // true sur Web
```

### Mode Développement

Ajoutez la classe `dev-mode` au body pour voir un indicateur visuel :

```tsx
// Dans un composant
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    document.body.classList.add('dev-mode');
  }
}, []);
```

## 📚 Références

- Provider : `providers/platform-provider.tsx`
- Hook : `lib/hooks/use-platform.ts`
- Styles Tauri : `app/tauri.css`
- Utilitaires : `lib/platform.ts`

---

**Prêt à l'emploi !** 🎉 L'architecture est maintenant en place et vous pouvez commencer à ajouter vos styles spécifiques à Tauri dans `app/tauri.css`.
