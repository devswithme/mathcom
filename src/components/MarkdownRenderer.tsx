// components/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
        strong: ({ children }) => (
          <strong style={{ fontWeight: "bold" }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: "italic" }}>{children}</em>
        ),
        br: () => <br />,
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <pre className="bg-gray-100 p-2 rounded-md overflow-auto">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="bg-gray-100 px-1 py-0.5 rounded">{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
