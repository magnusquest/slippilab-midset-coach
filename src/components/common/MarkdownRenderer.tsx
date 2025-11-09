import { createResource } from "solid-js";
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
  const [sanitizedHtml] = createResource(
    () => props.content,
    async (content) => {
      const rawHtml = await marked.parse(content);
      return DOMPurify.sanitize(rawHtml as string);
    }
  );

  return (
    <div
      class={props.class}
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
      innerHTML={sanitizedHtml() ?? ""}
    />
  );
}

