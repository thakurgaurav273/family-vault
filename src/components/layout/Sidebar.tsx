import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  Film,
  FileText,
  FolderOpen,
  Users,
  HardDrive,
  Settings,
  ShieldCheck,
  RefreshCw,
  ChevronUp,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { formatBytes } from '../../utils/formatters';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    switchUser,
    members,
    workspace,
    driveConnection,
    syncDriveNow,
  } = useFamilyVault();

  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncDriveNow();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/memories', label: 'Memories', icon: Sparkles },
    { to: '/photos', label: 'Photos', icon: ImageIcon },
    { to: '/videos', label: 'Videos', icon: Film },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/folders', label: 'Shared Folders', icon: FolderOpen },
    { to: '/family', label: 'Family Members', icon: Users },
    { to: '/storage', label: 'Storage', icon: HardDrive },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const usedFormatted = formatBytes(driveConnection.storageUsedBytes);
  const totalFormatted = formatBytes(driveConnection.storageTotalBytes, 0);
  const percentUsed = Math.min(
    100,
    driveConnection.storageTotalBytes ? Math.round((driveConnection.storageUsedBytes / driveConnection.storageTotalBytes) * 1000) / 10 : 0
  );

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 shrink-0 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-neutral-900 dark:text-neutral-100 text-base">
                FamilyVault
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[130px]">
              {workspace.name}
            </p>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
          Library & Vault
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-950 font-semibold dark:bg-neutral-800 dark:text-neutral-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 stroke-[1.9] shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Widget */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
        {/* Google Drive Status & Storage usage */}
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${driveConnection.isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {driveConnection.isConnected ? 'Google Drive' : 'Drive not connected'}
            </span>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync now with Google Drive"
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded transition-transform active:rotate-180"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
            <span>{usedFormatted} used</span>
            <span>{totalFormatted}</span>
          </div>
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="capitalize">{currentUser.role}</span>
                  {currentUser.relationship && <span>· {currentUser.relationship}</span>}
                </div>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-neutral-400 transition-transform ${
                isUserSwitcherOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Quick User Switcher Menu */}
          {isUserSwitcherOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Switch Role / Family Member
              </div>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      switchUser(member);
                      setIsUserSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      member.id === currentUser.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="truncate">{member.name}</span>
                      <span className="text-[10px] text-neutral-400 capitalize">({member.role})</span>
                    </div>
                    {member.id === currentUser.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
