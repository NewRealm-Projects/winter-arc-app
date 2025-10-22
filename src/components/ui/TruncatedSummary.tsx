import { useState } from 'react';

interface TruncatedSummaryProps {
  summary: string;
  details?: string[];
  className?: string;
}

function TruncatedSummary({ summary, details, className = '' }: TruncatedSummaryProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isTruncated = details && details.length > 0;

  if (!isTruncated) {
    return <span className={className}>{summary}</span>;
  }

  return (
    <div className="relative inline-block">
      <span
        className={`${className} cursor-pointer border-b border-dotted border-gray-400 dark:border-gray-500`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        role="button"
        tabIndex={0}
        aria-label="Show full list"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowTooltip(!showTooltip);
          }
        }}
      >
        {summary}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-[1200] mt-2 left-0 min-w-[200px] max-w-[300px] p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl border border-gray-700"
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            {details.map((item, index) => (
              <div key={index} className="whitespace-nowrap">
                • {item}
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 transform rotate-45" />
        </div>
      )}
    </div>
  );
}

export default TruncatedSummary;
