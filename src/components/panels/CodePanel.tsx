import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import type { Language } from '@/algorithms/types';

interface CodePanelProps {
  code: Record<Language, string>;
  highlightLines?: number[];
  pseudocode?: string;
}

const LANG_LABELS: Record<Language, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
};

const LANG_SYNTAX: Record<Language, string> = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
};

export function CodePanel({ code, highlightLines = [], pseudocode }: CodePanelProps) {
  const [selectedLang, setSelectedLang] = useState<Language | 'pseudo'>('python');
  const [copied, setCopied] = useState(false);

  const currentCode = selectedLang === 'pseudo' ? (pseudocode || '') : (code[selectedLang as Language] || '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      python: 'py',
      cpp: 'cpp',
      java: 'java',
      javascript: 'js',
      pseudo: 'txt',
    };
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorithm.${extensions[selectedLang]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const languages: (Language | 'pseudo')[] = ['python', 'cpp', 'java', 'javascript'];
  if (pseudocode) languages.push('pseudo');

  return (
    <div className="panel h-full flex flex-col">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Code</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className="btn-icon !w-7 !h-7"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            className="btn-icon !w-7 !h-7"
            title="Download"
          >
            <Download className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto flex-shrink-0">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLang(lang)}
            className={`relative px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              selectedLang === lang
                ? 'text-white'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {selectedLang === lang && (
              <motion.div
                layoutId="codeLang"
                className="absolute inset-0 bg-primary/15 border border-primary/20 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{lang === 'pseudo' ? 'Pseudocode' : LANG_LABELS[lang]}</span>
          </button>
        ))}
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SyntaxHighlighter
              language={selectedLang === 'pseudo' ? 'text' : LANG_SYNTAX[selectedLang as Language]}
              style={oneDark}
              showLineNumbers
              wrapLines
              lineProps={(lineNumber: number) => ({
                style: {
                  backgroundColor: highlightLines.includes(lineNumber)
                    ? 'rgba(108, 99, 255, 0.15)'
                    : 'transparent',
                  borderLeft: highlightLines.includes(lineNumber)
                    ? '3px solid #6C63FF'
                    : '3px solid transparent',
                  display: 'block',
                  paddingLeft: '8px',
                  transition: 'all 0.3s ease',
                },
              })}
              customStyle={{
                margin: 0,
                padding: '16px 0',
                background: 'transparent',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              {currentCode}
            </SyntaxHighlighter>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
