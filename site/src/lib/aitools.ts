// AI platforms in the daily work: one mark per tool, drawn on a 24px grid in
// currentColor so the row reads as one set. Names come from content/resume.json
// (aiTools); a name without a mark falls back to a neutral spark.

const MARKS: Record<string, string> = {
  OpenAI:
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3.2a4.4 4.4 0 0 1 4.3 3.5 4.4 4.4 0 0 1 2.4 7.2 4.4 4.4 0 0 1-4.1 6 4.4 4.4 0 0 1-7.2-.4 4.4 4.4 0 0 1-4.6-5.6 4.4 4.4 0 0 1 1.6-7.1A4.4 4.4 0 0 1 12 3.2Z"/><path d="M9.2 7.4v6.9l5.8 3.4M14.8 16.6V9.7L9 6.3M7.6 12.6l6-3.4 5.9 3.4M16.4 11.4l-6 3.4-5.9-3.4" stroke-linejoin="round"/></g>',
  Anthropic:
    '<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.8v5.4M12 15.8v5.4M2.8 12h5.4M15.8 12h5.4M5.5 5.5l3.8 3.8M14.7 14.7l3.8 3.8M18.5 5.5l-3.8 3.8M9.3 14.7l-3.8 3.8"/></g>',
  Gemini:
    '<path fill="currentColor" d="M12 2c.9 5.4 4.6 9.1 10 10-5.4.9-9.1 4.6-10 10-.9-5.4-4.6-9.1-10-10 5.4-.9 9.1-4.6 10-10Z"/>',
  'GitHub Copilot':
    '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 12.5c0-4.6 3.6-7.7 8-7.7s8 3.1 8 7.7v3.3c-2.1 2-4.9 3.2-8 3.2s-5.9-1.2-8-3.2Z"/><rect x="6.3" y="9.4" width="4.6" height="4" rx="1.6"/><rect x="13.1" y="9.4" width="4.6" height="4" rx="1.6"/></g><path fill="currentColor" d="M10.3 15.6h1v1.6h-1zM12.7 15.6h1v1.6h-1z"/>',
  Cursor:
    '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.8 20.2 7.5v9L12 21.2 3.8 16.5v-9Z"/><path d="M3.8 7.5 12 12l8.2-4.5M12 12v9.2"/></g><path fill="currentColor" d="M12 12 20.2 7.5 12 2.8Z" opacity=".55"/>',
  'T3 Code':
    '<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="12" y="15.9" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="800" fill="currentColor">T3</text>',
  Lovable:
    '<path fill="currentColor" d="M12 20.6 4.3 13.2a4.9 4.9 0 0 1 6.9-7l.8.8.8-.8a4.9 4.9 0 0 1 6.9 7Z"/>',
  v0:
    '<text x="12" y="16.6" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" font-weight="800" fill="currentColor" letter-spacing="-.5">v0</text>',
  Windsurf:
    '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 15.5c3-4.5 6-4.5 9 0s6 4.5 9 0"/><path d="M3 9.5c3-4.5 6-4.5 9 0s6 4.5 9 0" opacity=".6"/></g>',
  Perplexity:
    '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.5v19M5 8.5h14v7H5Z"/><path d="M5 8.5 12 3l7 5.5M5 15.5l7 5.5 7-5.5"/></g>',
  'Vercel AI Gateway':
    '<path fill="currentColor" d="M12 3.5 21.5 20h-19Z"/>',
};

const FALLBACK =
  '<path fill="currentColor" d="m12 4 1.6 6.4L20 12l-6.4 1.6L12 20l-1.6-6.4L4 12l6.4-1.6Z"/>';

export function aiMark(name: string): string {
  return MARKS[name] ?? FALLBACK;
}
