import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Laptop,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sliders,
  LogOut,
  FolderPlus,
  UserPlus,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { useFamilyVault } from '../../context/FamilyVaultContext';
import { formatRelativeTime } from '../../utils/formatters';
import { authService } from '../../services';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    workspace,
    driveConnection,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    theme,
    setTheme,
    setIsSearchOpen,
    setIsUploadOpen,
  } = useFamilyVault();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title & breadcrumbs
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Overview', section: 'Home' };
    if (path.startsWith('/memories')) return { title: 'Memories', section: 'Library' };
    if (path.startsWith('/photos')) return { title: 'Photos', section: 'Media' };
    if (path.startsWith('/videos')) return { title: 'Videos', section: 'Media' };
    if (path.startsWith('/documents')) return { title: 'Documents', section: 'Vault' };
    if (path.startsWith('/folders')) return { title: 'Shared Folders', section: 'Library' };
    if (path.startsWith('/family')) return { title: 'Family Members', section: 'People' };
    if (path.startsWith('/storage')) return { title: 'Storage & Drive', section: 'Cloud' };
    if (path.startsWith('/settings')) return { title: 'Settings', section: 'Preferences' };
    if (path.startsWith('/setup')) return { title: 'Setup Wizard', section: 'Onboarding' };
    return { title: 'FamilyVault', section: 'App' };
  };

  const { title, section } = getPageInfo();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      {/* Left: Breadcrumbs & Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="md:hidden flex items-center gap-2 mr-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="flex items-center text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          <span className="hidden sm:inline">{section}</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 mx-1" />
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Center / Search Bar trigger */}
      <div className="flex-1 max-w-md mx-3 sm:mx-8 hidden sm:block">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all text-xs"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search photos, documents, family...</span>
          </span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions Zone */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-neutral-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Notifications
                  </h3>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <EmptyState compact icon={Bell} label="No notifications yet" sublabel="Uploads and invitations will show up here." />
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.link) {
                          navigate(notif.link);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                        notif.isRead
                          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 opacity-75'
                          : 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {notif.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Upload Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700 transition-all"
            aria-label="User profile"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-neutral-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {currentUser.role}
                </span>
              </div>

              <div className="py-1 space-y-0.5 text-xs">
                {currentUser.role === 'owner' && !workspace.setupComplete && !driveConnection.isConnected && (
                <Link
                  to="/setup"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Sliders className="w-4 h-4 text-neutral-400" />
                  <span>Owner Setup Wizard</span>
                </Link>
                )}
                <Link
                  to="/family"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <UserPlus className="w-4 h-4 text-neutral-400" />
                  <span>Invite Family Member</span>
                </Link>
                <Link
                  to="/storage"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-400" />
                  <span>Google Drive Status</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Sliders className="w-4 h-4 text-neutral-400" />
                  <span>Settings & Preferences</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await authService.logout();
                    window.location.assign('/auth');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
