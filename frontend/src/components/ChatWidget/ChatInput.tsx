import React, { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  isLoading: boolean;
  brandColor: string;
}

export default function ChatInput({ onSend, disabled, isLoading, brandColor }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const placeholder = isLoading
    ? 'Saving your booking...'
    : disabled
    ? 'Chat complete'
    : 'Type your reply...';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 px-4 py-3 bg-white border-t border-gray-200"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity disabled:opacity-40"
        style={{ backgroundColor: brandColor }}
      >
        Send
      </button>
    </form>
  );
}
