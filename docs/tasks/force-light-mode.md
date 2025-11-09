# Force Light Mode

## Overview
Remove all dark mode styles and functionality from the application to ensure a consistent light mode experience across all components and pages. This simplifies the codebase, reduces bundle size, and provides a unified visual design.

## Objectives
- Remove all dark mode variant classes from Tailwind CSS usage
- Remove dark mode configuration from build tools
- Ensure all components use explicit light mode colors
- Eliminate any theme switching logic or state management
- Maintain visual consistency and design quality

## Technical Approach

### Current State Assessment
1. Search for all `dark:` prefix usage in component files
2. Check for dark mode configuration in `tailwind.config.js`
3. Look for theme-related state management (localStorage, signals, stores)
4. Identify any theme toggle UI components

### Removal Strategy
1. Audit all files for dark mode classes
2. Remove dark mode configuration
3. Ensure all colors are explicitly set to light mode values
4. Remove any theme switching logic
5. Test all pages and components

## Implementation Plan

### Step 1: Search for Dark Mode Classes
**Command**:
```bash
# Search for dark: variant classes
grep -r "dark:" src/ --include="*.tsx" --include="*.ts" --include="*.css"

# Search for theme-related code
grep -ri "theme" src/ --include="*.tsx" --include="*.ts"
grep -ri "darkmode\|dark-mode\|dark_mode" src/ --include="*.tsx" --include="*.ts"
```

**Action**: Document all occurrences for removal in subsequent steps.

### Step 2: Remove Dark Mode from Tailwind Config
**File**: `tailwind.config.js`

Check for and remove `darkMode` configuration:

```javascript
// If this exists, remove it:
module.exports = {
  darkMode: 'class', // or 'media' - REMOVE THIS LINE
  // ... rest of config
}
```

The default behavior (no darkMode setting) means dark mode variants won't be generated, reducing CSS bundle size.

### Step 3: Remove Dark Mode Classes from Components
**Files**: All `.tsx` files in `src/components/`

Search pattern: `dark:*`

For each occurrence:
1. Remove the `dark:` variant class
2. Ensure the light mode equivalent is present and correct
3. If no light mode class exists, add appropriate light mode styling

**Example transformations**:
```typescript
// Before:
class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"

// After:
class="bg-white text-slate-900"
```

```typescript
// Before:
class="border-slate-200 dark:border-slate-700"

// After:
class="border-slate-200"
```

### Step 4: Check for Theme State Management
**Files to check**:
- `src/state/*.tsx` (all store files)
- Any files with "theme" in the name
- localStorage usage related to theme

**Search for**:
- `localStorage.getItem('theme')`
- `localStorage.setItem('theme')`
- Theme-related signals or stores
- System theme detection (`window.matchMedia('(prefers-color-scheme: dark)')`)

**Action**: Remove all theme-related state management code.

### Step 5: Remove Theme Toggle UI (if exists)
**Search for**:
- Theme toggle buttons
- Dark mode icons (moon, sun icons)
- Theme selection dropdowns in settings

**Files likely to check**:
- `src/components/panels/SettingsDialog.tsx`
- `src/components/panels/TopBar.tsx`
- Any settings or preferences components

**Action**: Remove theme toggle UI components and related handlers.

### Step 6: Audit and Fix Color Usage
**Files**: All component files

Ensure all colors are explicitly defined (not relying on dark mode inheritance):

**Check these properties**:
- `bg-*` (backgrounds)
- `text-*` (text colors)
- `border-*` (border colors)
- `ring-*` (focus rings)
- `placeholder:*` (input placeholders)

**Ensure**:
- All backgrounds are light (white, slate-50, slate-100, etc.)
- All text is dark (slate-700, slate-800, slate-900, etc.)
- All borders are light (slate-200, slate-300, etc.)

### Step 7: Check Global Styles
**File**: Look for global CSS files (e.g., `src/index.css`, `src/styles/global.css`)

Remove any dark mode media queries:

```css
/* Remove blocks like this: */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #000;
    --foreground: #fff;
  }
}
```

### Step 8: Verify HTML/Root Element
**File**: `index.html` or wherever the root HTML is defined

Ensure no `dark` class on `<html>` or `<body>`:

```html
<!-- Remove 'dark' class if present -->
<html class="dark"> <!-- REMOVE 'dark' -->
<body>
```

Should be:
```html
<html>
<body>
```

## Files to Audit

### High Priority (most likely to have dark mode)
- [ ] `tailwind.config.js`
- [ ] `src/components/panels/SettingsDialog.tsx`
- [ ] `src/components/common/Dialog.tsx`
- [ ] `src/components/common/ChatInterface.tsx`
- [ ] `src/components/panels/TopBar.tsx`
- [ ] `src/components/App.tsx`
- [ ] `src/root.tsx`
- [ ] Any global CSS files

### Medium Priority
- [ ] All files in `src/components/panels/`
- [ ] All files in `src/components/common/`
- [ ] All files in `src/components/coach/`
- [ ] All files in `src/components/viewer/`

### Low Priority (less likely but check)
- [ ] State management files (`src/state/`)
- [ ] Utility files (`src/common/`)

## Testing Checklist

### Visual Testing
- [ ] Landing page displays in light mode
- [ ] Replay viewer displays in light mode
- [ ] Chat interface displays in light mode
- [ ] Review notes section displays in light mode
- [ ] All modals/dialogs display in light mode
- [ ] Settings dialog displays in light mode
- [ ] All buttons and controls display correctly
- [ ] Focus states are visible and correct
- [ ] Hover states work as expected

### Functional Testing
- [ ] No theme toggle UI visible
- [ ] No theme state in localStorage
- [ ] System dark mode preference has no effect
- [ ] All text is readable (good contrast)
- [ ] No flash of dark mode on page load
- [ ] No console errors related to theme

### Build Testing
- [ ] `npm run build` succeeds
- [ ] `npm run types` passes
- [ ] CSS bundle size reduced (check build output)
- [ ] No unused dark mode classes in production build

### Cross-browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Expected Changes Summary

### Likely Removals
1. Dark mode Tailwind variants (`dark:*` classes)
2. `darkMode` config in tailwind.config.js
3. Theme state management code
4. Theme toggle UI components
5. Dark mode media queries in CSS

### Likely Additions/Updates
1. Explicit light mode color classes where missing
2. Updated documentation (if any) about UI theming

## Rollback Plan

Before starting:
```bash
git checkout -b feature/force-light-mode
```

If issues arise:
```bash
git checkout dev
git branch -D feature/force-light-mode
```

Or to rollback specific files:
```bash
git checkout dev -- <file-path>
```

## Performance Benefits

- Smaller CSS bundle (no dark mode variants generated)
- Faster load time (less CSS to parse)
- No runtime theme detection logic
- No localStorage reads/writes for theme
- Simpler component rendering (no conditional theme classes)

## Accessibility Considerations

### Potential Concerns
- Some users prefer dark mode for eye strain reduction
- High contrast needs may not be met

### Mitigations
- Ensure sufficient color contrast ratios (WCAG AA minimum)
- Use proper semantic HTML
- Maintain focus indicators
- Consider adding dark mode back in future if user feedback demands it

### Contrast Ratios to Verify
- Normal text (< 18pt): 4.5:1 minimum
- Large text (≥ 18pt): 3:1 minimum
- UI components: 3:1 minimum

**Tool**: Use browser DevTools Accessibility panel or online contrast checkers.

## Success Criteria

- Zero `dark:` classes in the codebase
- No dark mode configuration in build tools
- All pages render in light mode only
- System dark mode preference has no effect
- CSS bundle size reduced
- All components visually consistent
- No theme-related console errors
- Build and type checking pass successfully
