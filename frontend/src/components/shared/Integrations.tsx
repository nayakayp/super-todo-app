import { useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cn } from '../../lib/utils';

// Types
type IntegrationType = 'slack' | 'email' | 'calendar' | 'github' | 'notion' | 'zapier';

type Integration = {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  isConnected: boolean;
  config?: Record<string, string>;
  connectedAt?: string;
};

type IntegrationStore = {
  integrations: Integration[];
  connect: (type: IntegrationType, config?: Record<string, string>) => void;
  disconnect: (type: IntegrationType) => void;
  isConnected: (type: IntegrationType) => boolean;
  getConfig: (type: IntegrationType) => Record<string, string> | undefined;
};

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    type: 'slack',
    name: 'Slack',
    description: 'Get notifications and create tasks from Slack',
    icon: '💬',
    isConnected: false,
  },
  {
    id: 'email',
    type: 'email',
    name: 'Email',
    description: 'Send task reminders and daily digests via email',
    icon: '📧',
    isConnected: false,
  },
  {
    id: 'calendar',
    type: 'calendar',
    name: 'Google Calendar',
    description: 'Sync due dates with your calendar',
    icon: '📅',
    isConnected: false,
  },
  {
    id: 'github',
    type: 'github',
    name: 'GitHub',
    description: 'Link tasks to issues and PRs',
    icon: '🐙',
    isConnected: false,
  },
  {
    id: 'notion',
    type: 'notion',
    name: 'Notion',
    description: 'Sync tasks with Notion databases',
    icon: '📝',
    isConnected: false,
  },
  {
    id: 'zapier',
    type: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps via Zapier',
    icon: '⚡',
    isConnected: false,
  },
];

export const useIntegrationStore = create<IntegrationStore>()(
  persist(
    (set, get) => ({
      integrations: DEFAULT_INTEGRATIONS,

      connect: (type, config) => {
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.type === type
              ? { ...i, isConnected: true, config, connectedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      disconnect: (type) => {
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.type === type
              ? { ...i, isConnected: false, config: undefined, connectedAt: undefined }
              : i
          ),
        }));
      },

      isConnected: (type) => {
        return get().integrations.find((i) => i.type === type)?.isConnected ?? false;
      },

      getConfig: (type) => {
        return get().integrations.find((i) => i.type === type)?.config;
      },
    }),
    { name: 'integrations-storage' }
  )
);

// Components
type IntegrationsPanelProps = {
  className?: string;
};

export function IntegrationsPanel({ className }: IntegrationsPanelProps) {
  const { integrations, connect, disconnect } = useIntegrationStore();
  const [configuring, setConfiguring] = useState<IntegrationType | null>(null);

  const connectedCount = integrations.filter((i) => i.isConnected).length;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🔌</span>
          Integrations
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect your favorite tools • {connectedCount} active
        </p>
      </div>

      <div className="p-4 grid gap-4">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={() => setConfiguring(integration.type)}
            onDisconnect={() => disconnect(integration.type)}
          />
        ))}
      </div>

      {configuring && (
        <IntegrationConfigModal
          type={configuring}
          onClose={() => setConfiguring(null)}
          onConnect={(config) => {
            connect(configuring, config);
            setConfiguring(null);
          }}
        />
      )}
    </div>
  );
}

// Integration card
function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center text-2xl shadow-sm">
        {integration.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {integration.name}
          </h3>
          {integration.isConnected && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
              Connected
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {integration.description}
        </p>
      </div>
      <div>
        {integration.isConnected ? (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

// Configuration modal
function IntegrationConfigModal({
  type,
  onClose,
  onConnect,
}: {
  type: IntegrationType;
  onClose: () => void;
  onConnect: (config: Record<string, string>) => void;
}) {
  const [config, setConfig] = useState<Record<string, string>>({});

  const getConfigFields = (): { key: string; label: string; type: 'text' | 'email' | 'url'; placeholder: string }[] => {
    switch (type) {
      case 'slack':
        return [
          { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...' },
          { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#general' },
        ];
      case 'email':
        return [
          { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
          { key: 'frequency', label: 'Digest Frequency', type: 'text', placeholder: 'daily, weekly' },
        ];
      case 'calendar':
        return [
          { key: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'primary' },
        ];
      case 'github':
        return [
          { key: 'token', label: 'Personal Access Token', type: 'text', placeholder: 'ghp_...' },
          { key: 'repo', label: 'Default Repository', type: 'text', placeholder: 'owner/repo' },
        ];
      case 'notion':
        return [
          { key: 'token', label: 'Integration Token', type: 'text', placeholder: 'secret_...' },
          { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: '...' },
        ];
      case 'zapier':
        return [
          { key: 'webhookUrl', label: 'Zapier Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...' },
        ];
      default:
        return [];
    }
  };

  const fields = getConfigFields();
  const integrationName = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connect {integrationName}
        </h3>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ))}

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> This is a demo integration. In production, you would configure OAuth or API tokens.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConnect(config)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact widget for sidebar
export function IntegrationsWidget({ className }: { className?: string }) {
  const { integrations } = useIntegrationStore();
  const connectedCount = integrations.filter((i) => i.isConnected).length;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔌</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Integrations
          </span>
        </div>
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
          {connectedCount}/{integrations.length}
        </span>
      </div>
      <div className="mt-2 flex -space-x-1">
        {integrations
          .filter((i) => i.isConnected)
          .map((i) => (
            <div
              key={i.id}
              className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs border-2 border-white dark:border-gray-800"
              title={i.name}
            >
              {i.icon}
            </div>
          ))}
      </div>
    </div>
  );
}
