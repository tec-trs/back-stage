import { type KeyboardEvent, useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Adicionar tag...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  function addTag(raw: string): void {
    const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  }

  function removeTag(tag: string): void {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded border border-line bg-canvas px-2 py-1.5 focus-within:border-slate-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-sm bg-surface-raised px-2 py-0.5 font-mono text-xs text-slate-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remover tag ${tag}`}
            className="leading-none text-slate-500 hover:text-slate-200"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue) addTag(inputValue);
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
    </div>
  );
}
