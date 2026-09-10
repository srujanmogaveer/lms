import React, { useState } from 'react';
import {
  FiCopy,
  FiCheck,
  FiBookOpen,
  FiCheckCircle,
  FiCode,
  FiTable,
} from 'react-icons/fi';
import type { PlayerLesson } from '../../types';

interface TextLessonContentProps {
  lesson: PlayerLesson;
}

export const TextLessonContent: React.FC<TextLessonContentProps> = ({ lesson }) => {
  const [copied, setCopied] = useState(false);
  const textContent = lesson.textContent;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!textContent) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 space-y-2">
        <FiBookOpen className="w-8 h-8 text-brand-500 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Interactive Reading Materials</h3>
        <p className="text-xs">No rich text content specified for this lesson slot yet.</p>
      </div>
    );
  }

  // Support both rich structured object and raw markdown/text string
  const isObject = typeof textContent === 'object';
  const subtitle = isObject ? textContent.subtitle : undefined;
  const introduction = isObject ? textContent.introduction : String(textContent);
  const sections = isObject && Array.isArray(textContent.sections) ? textContent.sections : [];
  const codeSnippet = isObject ? textContent.codeSnippet : undefined;
  const comparisonTable = isObject ? textContent.comparisonTable : undefined;
  const keyTakeaways = isObject && Array.isArray(textContent.keyTakeaways) ? textContent.keyTakeaways : [];

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-2xl space-y-8 shadow-xs text-slate-800 dark:text-slate-200">
      {/* Title Header */}
      <header className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
          <FiBookOpen className="w-4 h-4" /> Text Reading Module
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          {lesson.title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {subtitle}
          </p>
        )}
      </header>

      {/* Intro Paragraph */}
      {introduction && (
        <div className="p-5 bg-brand-50/50 dark:bg-brand-950/40 rounded-2xl border border-brand-200/60 dark:border-brand-900/60 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal whitespace-pre-line">
          {introduction}
        </div>
      )}

      {/* Sections */}
      {sections.map((section, idx) => (
        <section key={idx} className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {section.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </section>
      ))}

      {/* Syntax Highlighted Code Block */}
      {codeSnippet && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <FiCode className="w-4 h-4 text-brand-500" />
              {codeSnippet.filename} ({codeSnippet.language})
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 shadow-xl">
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <button
                onClick={() => handleCopyCode(codeSnippet.code)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
                title="Copy code snippet"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-5 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
              <code>{codeSnippet.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonTable && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiTable className="w-4 h-4 text-brand-500" /> Performance Comparison
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                  {comparisonTable.headers.map((h, i) => (
                    <th key={i} className="p-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisonTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-3.5 ${
                          cIdx === 0
                            ? 'font-bold text-slate-800 dark:text-slate-200'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Takeaways Callout */}
      {keyTakeaways.length > 0 && (
        <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-emerald-600" /> Key Takeaways
          </h3>
          <ul className="space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
            {keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};
