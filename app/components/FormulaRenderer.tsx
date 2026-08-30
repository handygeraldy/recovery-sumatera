'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaRendererProps {
  content: string;
}

export function FormulaRenderer({ content }: FormulaRendererProps) {
  // Cek apakah terdapat sintaks LaTeX math
  const hasFormula =
    content.includes('\\(') ||
    content.includes('\\[') ||
    content.includes('$$') ||
    content.includes('\\text{');

  if (!hasFormula) {
    return <span>{content}</span>;
  }

  // Regex untuk memisahkan block math $$...$$, \[...\], dan inline math \(...\)
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  const parts = content.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            return (
              <span
                key={index}
                className="katex-block-wrapper my-2 block overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-xs">{part}</code>;
          }
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            return (
              <span
                key={index}
                className="katex-block-wrapper my-2 block overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-xs">{part}</code>;
          }
        } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
            return (
              <span
                key={index}
                className="katex-inline-wrapper inline-block mx-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-xs">{part}</code>;
          }
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
