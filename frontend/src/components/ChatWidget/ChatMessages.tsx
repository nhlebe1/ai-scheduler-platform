import React, { useEffect, useRef } from 'react';
import { Message } from './useConversation';
import { ClientConfig } from '../../types';

interface Props {
  messages: Message[];
  config: ClientConfig;
  isTyping: boolean;
  onOptionClick: (option: string) => void;
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: '160ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: '320ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, config, isTyping, onOptionClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll on new messages AND when typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
      {messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                }`}
                style={msg.role === 'user' ? { backgroundColor: config.brandColor } : {}}
              >
                {msg.text}
              </div>

              {/* Option buttons only on the last message — prevents clicking stale choices */}
              {msg.options && msg.role === 'bot' && isLastMessage && !isTyping && (
                <div className="flex flex-col gap-1.5">
                  {msg.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onOptionClick(opt)}
                      className="text-left px-3 py-2 rounded-lg text-sm font-medium border-2 bg-white transition-all hover:opacity-80 active:scale-95"
                      style={{ borderColor: config.brandColor, color: config.brandColor }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isTyping && <TypingBubble />}

      <div ref={bottomRef} />
    </div>
  );
}
