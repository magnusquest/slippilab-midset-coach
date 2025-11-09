# Disable Key Bindings for Replay Controls While Typing in Text Boxes

## Overview
Prevent replay control keyboard shortcuts from triggering when users are actively typing in input or textarea elements. This fixes the frustrating issue where typing letters like 'k', 'l', 'j', space, etc. in chat messages or review notes accidentally controls the replay viewer.

## Objectives
- Allow users to type freely in text inputs without triggering replay controls
- Maintain full keyboard control functionality when not typing
- Provide intuitive, predictable behavior
- Require minimal code changes

## Problem Statement

### Current Behavior
The Controls component (`src/components/viewer/Controls.tsx`) attaches global keyboard event listeners that respond to various keys:
- `k`, `K`, `Space`: Toggle pause/play
- `j`, `J`, `ArrowLeft`: Rewind
- `l`, `L`, `ArrowRight`: Fast forward
- `0-9`: Jump to percentage
- And many more...

When users type in ChatInterface or ReviewNotesSection text fields, these shortcuts still fire, causing:
- Unexpected replay jumps while typing numbers
- Pause/play toggling while typing 'k' or space
- Navigation while typing 'j' or 'l'
- Poor user experience and workflow interruption

### Desired Behavior
Keyboard shortcuts should be ignored when:
- User is typing in an `<input>` element
- User is typing in a `<textarea>` element
- Focus is within any text entry field

Keyboard shortcuts should work normally when:
- Focus is on the document body
- Focus is on non-text elements (buttons, divs, etc.)
- User is navigating with Tab/Shift+Tab

## Technical Approach

### Solution
Add a guard check at the start of both `onKeyDown` and `onKeyUp` handlers to detect if the user is currently typing in a text input field. If so, return early without processing any shortcuts.

### Detection Logic
Check if `document.activeElement` is an instance of `HTMLInputElement` or `HTMLTextAreaElement`.

## Implementation Plan

### Step 1: Create Helper Function
**File**: `src/components/viewer/Controls.tsx`

Add a utility function before the `Controls` component (around line 22):

```typescript
/**
 * Determines if keyboard shortcuts should be ignored because
 * the user is typing in a text input field.
 */
function isTypingInTextBox(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  );
}
```

### Step 2: Update onKeyDown Handler
**File**: `src/components/viewer/Controls.tsx`

Update the `onKeyDown` function (starting at line 32):

```typescript
function onKeyDown({ key }: KeyboardEvent): void {
  // Ignore all keyboard shortcuts when typing in text fields
  if (isTypingInTextBox()) {
    return;
  }

  switch (key) {
    case "k":
    case "K":
    case " ":
      togglePause();
      break;
    // ... rest of existing cases
  }
}
```

### Step 3: Update onKeyUp Handler
**File**: `src/components/viewer/Controls.tsx`

Update the `onKeyUp` function (starting at line 112):

```typescript
function onKeyUp({ key }: KeyboardEvent): void {
  // Ignore all keyboard shortcuts when typing in text fields
  if (isTypingInTextBox()) {
    return;
  }

  switch (key) {
    case "ArrowUp":
    case "ArrowDown":
      speedNormal();
      break;
  }
}
```

## Complete Code Reference

### Before (Current Implementation)
```typescript
function onKeyDown({ key }: KeyboardEvent): void {
  switch (key) {
    case "k":
    case "K":
    case " ":
      togglePause();
      break;
    // ... more cases
  }
}

function onKeyUp({ key }: KeyboardEvent): void {
  switch (key) {
    case "ArrowUp":
    case "ArrowDown":
      speedNormal();
      break;
  }
}
```

### After (Fixed Implementation)
```typescript
function isTypingInTextBox(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  );
}

function onKeyDown({ key }: KeyboardEvent): void {
  if (isTypingInTextBox()) {
    return;
  }

  switch (key) {
    case "k":
    case "K":
    case " ":
      togglePause();
      break;
    // ... more cases
  }
}

function onKeyUp({ key }: KeyboardEvent): void {
  if (isTypingInTextBox()) {
    return;
  }

  switch (key) {
    case "ArrowUp":
    case "ArrowDown":
      speedNormal();
      break;
  }
}
```

## Testing Checklist

### Manual Testing
- [ ] Open the application and load a replay
- [ ] Focus on ChatInterface textarea
- [ ] Type the following characters: `k l j space 0 1 2 3 d f`
- [ ] Verify NO replay controls are triggered
- [ ] Click outside the textarea (blur focus)
- [ ] Press the same keys
- [ ] Verify replay controls DO work
- [ ] Focus on ReviewNotesSection textarea (any field)
- [ ] Type the same test characters
- [ ] Verify NO replay controls are triggered
- [ ] Test with input elements (if any exist in the app)
- [ ] Verify same behavior

### Edge Cases
- [ ] Pressing Escape while typing (should it close modals? Currently yes, which is probably fine)
- [ ] Rapid switching between text field and viewer
- [ ] Multiple text fields on screen
- [ ] Text field loses focus vs. explicitly blurred
- [ ] Text field in modal vs. main content

### Regression Testing
- [ ] All keyboard shortcuts still work when NOT typing
- [ ] Seekbar input still works
- [ ] Keyboard navigation (Tab) still works
- [ ] No console errors
- [ ] Build succeeds (`npm run build`)
- [ ] Type checking passes (`npm run types`)

## Affected Components

### Primary
- `src/components/viewer/Controls.tsx` - Main implementation

### Secondary (no changes needed, but good to test)
- `src/components/common/ChatInterface.tsx` - Text input used for testing
- `src/components/panels/ReviewNotesSection.tsx` - Multiple textareas used for testing

## Alternative Approaches Considered

### 1. Event Listener on Individual Inputs (Rejected)
Add `onKeyDown` handlers to each input/textarea to call `event.stopPropagation()`.

**Pros**: More explicit, component-level control
**Cons**: Requires modifying multiple components, easy to forget for new inputs, more code duplication

### 2. Check for Specific Keys Only (Rejected)
Only ignore text-related keys (a-z, 0-9) but allow arrows, escape, etc.

**Pros**: Some shortcuts like arrow keys could still work
**Cons**: Confusing behavior (why do some keys work and others don't?), arrows are used for replay control

### 3. Use Capture Phase (Rejected)
Attach listener in capture phase and check there.

**Pros**: Centralized early in event flow
**Cons**: Unnecessarily complex for this use case

## Browser Compatibility

The solution uses standard DOM APIs available in all modern browsers:
- `document.activeElement` - Supported in all browsers
- `instanceof HTMLInputElement` - Supported in all browsers
- `instanceof HTMLTextAreaElement` - Supported in all browsers

No polyfills or feature detection needed.

## Performance Considerations

- The `isTypingInTextBox()` function is extremely lightweight (2 instanceof checks)
- Called on every keydown/keyup, but negligible performance impact
- No memory leaks or listener accumulation

## Accessibility Considerations

- Screen reader users can still type in text fields without interruption
- Keyboard-only users maintain full control when not typing
- Focus management remains unchanged
- No impact on ARIA attributes or roles

## Success Criteria

- Users can type any characters in text inputs without triggering replay controls
- Keyboard shortcuts work normally when focus is outside text inputs
- No regression in existing keyboard navigation
- Clean, maintainable code with minimal changes
- No console errors or warnings
