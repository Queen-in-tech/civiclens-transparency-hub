/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { ElementType } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Turns the AI's markdown (asterisks, hashes, dashes) into clean, styled text.
// Raw HTML in the reply is not rendered, so it is safe to show.
const el = (Tag: ElementType, className: string) =>
  ({ node, ...props }: any) => <Tag {...props} className={className} />;

const components = {
  p: el("p", ""),
  strong: el("strong", "font-semibold"),
  em: el("em", "italic"),
  ul: el("ul", "list-disc space-y-1 pl-5"),
  ol: el("ol", "list-decimal space-y-1 pl-5"),
  h1: el("h3", "mt-4 font-display text-xl font-bold"),
  h2: el("h3", "mt-4 font-display text-xl font-bold"),
  h3: el("h4", "mt-3 font-display text-lg font-bold"),
  h4: el("h4", "mt-3 font-display text-base font-bold"),
  hr: el("hr", "border-border"),
  blockquote: el("blockquote", "border-l-4 border-gold pl-4 text-muted-foreground"),
  code: el("code", "bg-secondary px-1 font-mono text-sm"),
  pre: el("pre", "overflow-x-auto bg-secondary p-3 text-sm"),
  a: ({ node, ...props }: any) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4" />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto"><table {...props} className="w-full text-left text-sm" /></div>
  ),
  th: el("th", "border-b border-border py-2 pr-4 font-semibold"),
  td: el("td", "border-b border-border py-2 pr-4 align-top"),
};

const Markdown = ({ children }: { children: string }) => {
  // Some flows send line breaks as the two characters \n instead of a real break
  const text = children.includes("\n") ? children : children.replace(/\\n/g, "\n");
  return (
    <div className="space-y-3 leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text.trim()}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
