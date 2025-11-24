import React from 'react';

interface CodeViewerProps {
  code: string;
  highlightLine: number;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, highlightLine }) => {
  const lines = code.split('\n');

  return (
    <div className="bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-700 h-full flex flex-col">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <span className="text-slate-200 font-mono text-sm font-bold">Source Code (C++)</span>
      </div>
      <div className="overflow-auto p-4 flex-1 font-mono text-xs md:text-sm">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted = lineNumber === highlightLine;
          
          return (
            <div 
              key={index} 
              className={`flex leading-6 ${isHighlighted ? 'bg-blue-900/50 -mx-4 px-4 border-l-4 border-blue-400' : ''}`}
            >
              <span className="text-slate-500 w-8 flex-shrink-0 select-none text-right mr-4">{lineNumber}</span>
              <span className={`${isHighlighted ? 'text-white font-bold' : 'text-slate-300'}`}>
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};