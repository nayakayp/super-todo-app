import { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cn } from '../../lib/utils';

// Types
type WorkspaceMember = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
};

type Workspace = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  members: WorkspaceMember[];
  createdAt: string;
  isPersonal?: boolean;
};

type WorkspaceStore = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'members'>) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  addMember: (workspaceId: string, member: Omit<WorkspaceMember, 'joinedAt'>) => void;
  removeMember: (workspaceId: string, memberId: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
};

const WORKSPACE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-red-500',
];

const WORKSPACE_ICONS = ['🏢', '🏠', '💼', '🎯', '🚀', '⭐', '💡', '🔧', '📚', '🎨'];

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [
        {
          id: 'personal',
          name: 'Personal',
          icon: '🏠',
          color: 'bg-blue-500',
          members: [],
          createdAt: new Date().toISOString(),
          isPersonal: true,
        },
      ],
      activeWorkspaceId: 'personal',

      createWorkspace: (workspace) => {
        const newWorkspace: Workspace = {
          ...workspace,
          id: crypto.randomUUID(),
          members: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
        }));
        return newWorkspace;
      },

      updateWorkspace: (id, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWorkspace: (id) => {
        const { activeWorkspaceId, workspaces } = get();
        set({
          workspaces: workspaces.filter((w) => w.id !== id),
          activeWorkspaceId: activeWorkspaceId === id ? 'personal' : activeWorkspaceId,
        });
      },

      setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id });
      },

      addMember: (workspaceId, member) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  members: [
                    ...w.members,
                    { ...member, joinedAt: new Date().toISOString() },
                  ],
                }
              : w
          ),
        }));
      },

      removeMember: (workspaceId, memberId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, members: w.members.filter((m) => m.id !== memberId) }
              : w
          ),
        }));
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId);
      },
    }),
    { name: 'workspace-storage' }
  )
);

// Components
type WorkspaceSwitcherProps = {
  className?: string;
};

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className={cn('w-6 h-6 rounded flex items-center justify-center text-sm', activeWorkspace?.color)}>
          {activeWorkspace?.icon}
        </div>
        <span className="font-medium text-gray-900 dark:text-white max-w-[120px] truncate">
          {activeWorkspace?.name || 'Select Workspace'}
        </span>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40 py-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setActiveWorkspace(workspace.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  workspace.id === activeWorkspaceId && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', workspace.color)}>
                  {workspace.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {workspace.name}
                  </div>
                  {workspace.members.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {workspace.members.length} member{workspace.members.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {workspace.id === activeWorkspaceId && (
                  <span className="text-blue-500">✓</span>
                )}
              </button>
            ))}

            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center">
                  +
                </span>
                <span className="text-sm font-medium">Create Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Create Workspace Modal
function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { createWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏢');
  const [color, setColor] = useState('bg-blue-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const workspace = createWorkspace({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
    });
    setActiveWorkspace(workspace.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🏢</span>
          Create Workspace
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                    icon === i
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full',
                    c,
                    color === c && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Team members list
type TeamMembersProps = {
  workspaceId: string;
  className?: string;
};

export function TeamMembers({ workspaceId, className }: TeamMembersProps) {
  const { workspaces, addMember, removeMember } = useWorkspaceStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) return null;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>👥</span>
          Team Members
        </h3>
        <button
          onClick={() => setShowInviteModal(true)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          + Invite
        </button>
      </div>

      {workspace.members.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No team members yet</p>
          <p className="text-xs mt-1">Invite people to collaborate</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workspace.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {member.avatar || member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {member.name}
                </div>
                <div className="text-xs text-gray-500 truncate">{member.email}</div>
              </div>
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                member.role === 'owner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                member.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              )}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={(email, name) => {
            addMember(workspaceId, {
              id: crypto.randomUUID(),
              email,
              name,
              role: 'member',
            });
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}

// Invite member modal
function InviteMemberModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, name: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    onInvite(email.trim(), name.trim());
  };

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
          Invite Team Member
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
