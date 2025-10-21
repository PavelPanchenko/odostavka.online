'use client';

import { InputHTMLAttributes, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export default function SearchInput({ 
  value,
  onChange,
  onClear,
  placeholder = 'Поиск...',
  className = '',
  ...props 
}: SearchInputProps) {
  const handleClear = useCallback(() => {
    onChange('');
    onClear?.();
  }, [onChange, onClear]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-10 py-2
          border border-gray-300 rounded-lg 
          transition-all duration-200
          focus:border-green-500 focus:ring-2 focus:ring-green-200
          placeholder:text-gray-400
          outline-none
          ${className}
        `}
        {...props}
      />
      
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

