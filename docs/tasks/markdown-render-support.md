# Markdown Render Support for Notes and AI Chat

## Overview
Add markdown rendering to the ChatInterface component (AI chat bubbles) and ReviewNotesSection (review notes display) using the `marked` library with extended features including bold, italic, lists, code blocks, tables, task lists, and strikethrough.

## Objectives
- Enable rich text formatting in AI chat responses
- Support markdown in review notes for better organization and readability
- Maintain security by sanitizing rendered HTML
- Keep consistent styling with existing design system

## Technical Approach

### Dependencies
- **marked**: Lightweight markdown parser (https://github.com/markedjs/marked)
- **DOMPurify**: HTML sanitizer to prevent XSS attacks

### Architecture
1. Create a shared `MarkdownRenderer` component in `src/components/common/`
2. Configure `marked` with extended features enabled
3. Sanitize all rendered HTML using DOMPurify
4. Apply Tailwind typography styles for markdown elements
5. Replace plain text rendering in ChatInterface and ReviewNotesSection

## Implementation Plan

### Step 1: Install Dependencies
```bash
npm install marked dompurify
npm install --save-dev @types/dompurify
```

### Step 2: Create MarkdownRenderer Component
**File**: `src/components/common/MarkdownRenderer.tsx`

```typescript
import { createMemo } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Configure marked with extended features
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

interface MarkdownRendererProps {
  content: string;
  class?: string;
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const sanitizedHtml = createMemo(() => {
    const rawHtml = marked.parse(props.content);
    return DOMPurify.sanitize(rawHtml);
  });

  return (
    <div
      class={props.class}
      innerHTML={sanitizedHtml()}
    />
  );
}
```

### Step 3: Add Markdown Styles
**File**: `src/components/common/MarkdownRenderer.tsx` (update)

Add Tailwind classes for markdown styling within the component or create a dedicated CSS class:

```typescript
export function MarkdownRenderer(props: MarkdownRendererProps) {
  const sanitizedHtml = createMemo(() => {
    const rawHtml = marked.parse(props.content);
    return DOMPurify.sanitize(rawHtml);
  });

  return (
    <div
      class={`markdown-content ${props.class || ""}`}
      classList={{
        "prose prose-sm max-w-none": true,
        "prose-headings:font-semibold prose-headings:text-slate-800": true,
        "prose-p:text-slate-700 prose-p:my-2": true,
        "prose-a:text-slippi-600 prose-a:underline": true,
        "prose-strong:text-slate-900 prose-strong:font-semibold": true,
        "prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-slate-800": true,
        "prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-pre:p-3 prose-pre:rounded": true,
        "prose-ul:list-disc prose-ul:ml-4 prose-ul:my-2": true,
        "prose-ol:list-decimal prose-ol:ml-4 prose-ol:my-2": true,
        "prose-li:text-slate-700": true,
        "prose-table:border-collapse prose-table:w-full": true,
        "prose-th:border prose-th:border-slate-300 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-left": true,
        "prose-td:border prose-td:border-slate-300 prose-td:px-3 prose-td:py-2": true,
      }}
      innerHTML={sanitizedHtml()}
    />
  );
}
```

### Step 4: Update ChatInterface Component
**File**: `src/components/common/ChatInterface.tsx`

Replace line 61 (plain text div) with MarkdownRenderer:

```typescript
// Add import at top
import { MarkdownRenderer } from "~/components/common/MarkdownRenderer";

// Replace line 61:
// OLD: <div class="whitespace-pre-line">{message.content}</div>
// NEW:
<MarkdownRenderer
  content={message.content}
  class="whitespace-pre-line"
/>
```

### Step 5: Update ReviewNotesSection Component
**File**: `src/components/panels/ReviewNotesSection.tsx`

Update the `ReviewField` component (around line 362-370):

```typescript
// Add import at top
import { MarkdownRenderer } from "~/components/common/MarkdownRenderer";

// Update ReviewField component:
function ReviewField(props: { label: string; value: string }) {
  return (
    <div class="flex flex-col gap-1">
      <div class="text-sm font-semibold text-slate-700">{props.label}</div>
      <Show
        when={props.value.length > 0}
        fallback={
          <div class="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            —
          </div>
        }
      >
        <MarkdownRenderer
          content={props.value}
          class="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </Show>
    </div>
  );
}
```

## Testing Checklist

- [ ] Install dependencies successfully
- [ ] MarkdownRenderer component renders basic markdown (bold, italic, lists)
- [ ] Code blocks render with proper styling
- [ ] Tables render correctly
- [ ] Task lists display properly
- [ ] Strikethrough text works
- [ ] HTML is sanitized (test with `<script>alert('xss')</script>`)
- [ ] ChatInterface displays markdown in AI responses
- [ ] ReviewNotesSection displays markdown in all note fields
- [ ] Styling matches existing design system
- [ ] No console errors or warnings
- [ ] Build completes successfully (`npm run build`)

## Security Considerations

- DOMPurify sanitizes all HTML output to prevent XSS attacks
- `marked` is configured with safe defaults (GFM enabled, breaks enabled)
- No inline HTML rendering allowed
- All user content is treated as untrusted and sanitized

## Rollback Plan

If issues arise:
1. Remove MarkdownRenderer imports from ChatInterface and ReviewNotesSection
2. Restore original plain text rendering
3. Uninstall marked and dompurify packages
4. Revert component changes via git

## Success Criteria

- Users can write markdown in chat and notes
- Markdown renders correctly with appropriate styling
- No XSS vulnerabilities
- Performance remains acceptable (no lag when rendering)
- Visual consistency maintained across the application
