import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

type MarkdownRendererProps = {
  content: string;
  className?: string;
  compact?: boolean;
};

export function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        compact && 'prose-compact',
        className
      )}
      components={{
        // Custom rendering for compact mode
        h1: ({ children }) => (
          <h1 className={cn('text-lg font-bold', compact && 'text-sm')}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className={cn('text-base font-semibold', compact && 'text-sm')}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className={cn('text-sm font-semibold', compact && 'text-xs')}>{children}</h3>
        ),
        p: ({ children }) => (
          <p className={cn('my-1', compact && 'my-0.5 text-xs')}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className={cn('list-disc pl-4 my-1', compact && 'my-0.5 text-xs')}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className={cn('list-decimal pl-4 my-1', compact && 'my-0.5 text-xs')}>{children}</ol>
        ),
        li: ({ children }) => (
          <li className={cn('my-0.5', compact && 'my-0')}>{children}</li>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {children}
          </a>
        ),
        code: ({ children, className: codeClassName }) => {
          const isInline = !codeClassName;
          return isInline ? (
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
              {children}
            </code>
          ) : (
            <code className={cn(codeClassName, 'block p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-x-auto')}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-gray-100 dark:bg-gray-700 rounded p-2 overflow-x-auto my-2">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2 text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-gray-200 dark:border-gray-700" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-left text-xs font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1 border border-gray-200 dark:border-gray-600 text-xs">
            {children}
          </td>
        ),
        input: ({ type, checked }) => {
          if (type === 'checkbox') {
            return (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="mr-1 rounded border-gray-300 dark:border-gray-600"
              />
            );
          }
          return null;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Simple inline markdown preview (for todo items)
type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  // Strip markdown for preview, showing just plain text
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  return (
    <span className={cn('text-gray-600 dark:text-gray-400', className)}>
      {plainText.length > 100 ? `${plainText.slice(0, 100)}...` : plainText}
    </span>
  );
}
