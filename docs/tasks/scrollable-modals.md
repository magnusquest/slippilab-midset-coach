# Scrollable Inside Modals

## Overview
Update the Dialog component to support scrollable content with sticky header and footer. When modal content exceeds viewport height, the content area scrolls independently while the title and action buttons remain visible and accessible.

## Objectives
- Enable long-form content in modals without breaking layout
- Maintain context by keeping title visible while scrolling
- Keep action buttons accessible at all times
- Provide smooth, intuitive scrolling experience

## Technical Approach

### Current State
The Dialog component (`src/components/common/Dialog.tsx`) uses `@zag-js/dialog` and renders:
- Backdrop with blur effect
- Content wrapper with fixed max-width
- Title section
- Description/contents section

### Proposed Changes
- Add max-height constraint to modal container
- Restructure layout to separate header, scrollable body, and footer
- Create new `Dialog.Footer` component for action buttons
- Apply flex layout with overflow control

## Implementation Plan

### Step 1: Update Dialog Component Structure
**File**: `src/components/common/Dialog.tsx`

Update the content rendering section (lines 46-56):

```typescript
// OLD structure:
<div
  {...api().contentProps}
  class="w-full max-w-xl rounded-md border border-slate-300 bg-white p-8"
>
  <div {...api().titleProps} class="w-full">
    <Show when={parts.title}>{parts.title}</Show>
  </div>
  <div {...api().descriptionProps} class="w-full">
    <Show when={parts.contents}>{parts.contents}</Show>
  </div>
</div>

// NEW structure:
<div
  {...api().contentProps}
  class="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-md border border-slate-300 bg-white"
>
  {/* Sticky Header */}
  <div class="flex-shrink-0 border-b border-slate-200 px-8 pt-8 pb-4">
    <div {...api().titleProps} class="w-full">
      <Show when={parts.title}>{parts.title}</Show>
    </div>
  </div>

  {/* Scrollable Content */}
  <div class="flex-1 overflow-y-auto px-8 py-4">
    <div {...api().descriptionProps} class="w-full">
      <Show when={parts.contents}>{parts.contents}</Show>
    </div>
  </div>

  {/* Sticky Footer (if present) */}
  <Show when={parts.footer}>
    <div class="flex-shrink-0 border-t border-slate-200 px-8 pb-8 pt-4">
      {parts.footer}
    </div>
  </Show>
</div>
```

### Step 2: Add Footer Support to DialogParts Interface
**File**: `src/components/common/Dialog.tsx`

Update the `DialogParts` interface (lines 15-20):

```typescript
interface DialogParts {
  api: Accessor<ReturnType<typeof dialog.connect>>;
  trigger?: JSX.Element;
  title?: JSX.Element;
  contents?: JSX.Element;
  footer?: JSX.Element;  // Add this line
}
```

### Step 3: Create Dialog.Footer Component
**File**: `src/components/common/Dialog.tsx`

Add new Footer component (after the Contents component, around line 91):

```typescript
function Footer(props: { children: JSX.Element }) {
  const parts = useContext(DialogPartsContext);
  if (!parts) {
    throw new Error("<Dialog.Footer> used outside <Dialog>");
  }

  parts.footer = props.children;
  return null;
}
```

### Step 4: Export Footer Component
**File**: `src/components/common/Dialog.tsx`

Update the export statement (line 110):

```typescript
export const Dialog = Object.assign(Base, {
  Trigger,
  Title,
  Contents,
  Footer,      // Add this line
  Close,
  useDialogApi,
});
```

### Step 5: Update AIReviewDialog to Use Footer
**File**: `src/components/panels/AIReviewDialog.tsx`

Review the component and move action buttons to `Dialog.Footer` if they exist outside the scrollable content area. Example pattern:

```typescript
<Dialog>
  <Dialog.Trigger>
    {/* trigger button */}
  </Dialog.Trigger>

  <Dialog.Title>
    {/* title */}
  </Dialog.Title>

  <Dialog.Contents>
    {/* main content - this will scroll */}
  </Dialog.Contents>

  <Dialog.Footer>
    {/* action buttons - stays visible */}
    <div class="flex gap-2 justify-end">
      <Dialog.Close>
        <SecondaryButton>Cancel</SecondaryButton>
      </Dialog.Close>
      <PrimaryButton onClick={handleSubmit}>
        Submit
      </PrimaryButton>
    </div>
  </Dialog.Footer>
</Dialog>
```

### Step 6: Update SettingsDialog (if exists)
**File**: `src/components/panels/SettingsDialog.tsx`

Apply the same pattern as Step 5 to move action buttons to `Dialog.Footer`.

### Step 7: Update UploadDialog (if applicable)
**File**: `src/components/panels/UploadDialog.tsx`

Check if this component uses Dialog and update accordingly.

## CSS/Styling Details

### Modal Container
```
flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-md border border-slate-300 bg-white
```
- `flex flex-col`: Vertical stack layout
- `max-h-[85vh]`: Limit height to 85% of viewport
- `overflow-hidden`: Prevent outer scroll, control inner scroll

### Header (Title Section)
```
flex-shrink-0 border-b border-slate-200 px-8 pt-8 pb-4
```
- `flex-shrink-0`: Prevent compression
- `border-b`: Visual separator
- Maintains original padding

### Content (Scrollable Area)
```
flex-1 overflow-y-auto px-8 py-4
```
- `flex-1`: Takes all available space
- `overflow-y-auto`: Scrolls when content overflows
- Reduced vertical padding (content padding, not modal padding)

### Footer (Action Buttons)
```
flex-shrink-0 border-t border-slate-200 px-8 pb-8 pt-4
```
- `flex-shrink-0`: Prevent compression
- `border-t`: Visual separator
- Maintains original padding

## Testing Checklist

- [ ] Dialog component compiles without errors
- [ ] Existing dialogs (AIReviewDialog, SettingsDialog) still render correctly
- [ ] Short content: Modal displays normally without unnecessary scrollbars
- [ ] Long content: Content area scrolls while title stays visible
- [ ] With footer: Action buttons remain visible while scrolling
- [ ] Without footer: Layout works correctly without footer section
- [ ] Scrollbar styling is consistent with design system
- [ ] Modal doesn't exceed viewport height on small screens
- [ ] Touch scrolling works on mobile/tablet
- [ ] Keyboard navigation (Tab, Shift+Tab) works correctly
- [ ] No layout shift when opening/closing modals

## Edge Cases

### Very Long Titles
If title is extremely long, consider adding:
```
max-h-[20vh] overflow-y-auto
```
to the header section.

### Very Tall Footers
If footer contains many buttons/actions:
```
max-h-[15vh] overflow-y-auto
```
to the footer section.

### Small Viewports
On mobile devices (< 640px), consider reducing max-height:
```
max-h-[90vh] sm:max-h-[85vh]
```

## Accessibility Considerations

- Scrollable region should be keyboard accessible
- Screen readers should announce scrollable content
- Focus should remain within modal when scrolling
- Close button (if in header) should remain accessible

## Rollback Plan

If issues arise:
1. Revert Dialog.tsx to previous structure
2. Remove Dialog.Footer component
3. Restore original padding/layout classes
4. Test all dialogs for proper rendering

## Success Criteria

- Users can scroll through long modal content
- Title and footer remain visible during scroll
- No visual glitches or layout breaks
- Smooth scrolling experience on all devices
- Existing dialogs continue to work without modification (backward compatible)
