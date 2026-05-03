import React from 'react';
import { ClientConfig } from '../../types';
import { useConversation } from './useConversation';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface Props {
  config: ClientConfig;
}

export default function ChatWidget({ config }: Props) {
  const { messages, step, isLoading, isTyping, sendMessage } = useConversation(config);

  const inputDisabled = isTyping || isLoading || step === 'booked' || step === 'error';

  return (
    <div className="flex flex-col h-full rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white flex-shrink-0"
        style={{ backgroundColor: config.brandColor }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white"
          style={{ color: config.brandColor }}
        >
          {config.logoText}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm">{config.name}</div>
          <div className="text-xs opacity-75">
            {config.assistantName} · Scheduling Assistant
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs opacity-75">Online</span>
        </div>
      </div>

      {/* Business hours banner */}
      <div
        className="px-4 py-1.5 text-xs text-center flex-shrink-0"
        style={{ backgroundColor: config.brandColorLight, color: config.brandColor }}
      >
        {config.businessHours}
      </div>

      {/* Message list */}
      <ChatMessages messages={messages} config={config} isTyping={isTyping} onOptionClick={sendMessage} />

      {/* Text input */}
      <ChatInput
        onSend={sendMessage}
        disabled={inputDisabled}
        isLoading={isLoading}
        brandColor={config.brandColor}
      />
    </div>
  );
}
