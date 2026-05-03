import React, { useEffect, useState } from 'react';
import { ClientConfig } from '../types';
import { fetchConfig } from '../api';
import ChatWidget from '../components/ChatWidget/ChatWidget';

const CLIENT_ID = 'johnson-roofing';

export default function WidgetPage() {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig(CLIENT_ID)
      .then(setConfig)
      .catch(() => setError('Could not load client configuration. Is the backend running?'));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-53px)]">
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl px-8 py-6">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1 text-red-400">
            Make sure the backend is running on port 3001.
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-53px)]">
        <div className="text-gray-400 text-sm">Loading widget...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-53px)] p-8 bg-gray-100">
      <div className="w-full max-w-sm" style={{ height: '620px' }}>
        <ChatWidget config={config} />
      </div>
    </div>
  );
}
