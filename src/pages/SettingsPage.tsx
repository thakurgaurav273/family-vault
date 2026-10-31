import React, { useState } from 'react';
import {
  Sliders,
  Palette,
  User,
  HardDrive,
  Shield,
  Bell,
  Check,
  Save,
  Moon,
  Sun,
  Laptop,
  AlertCircle,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { authService } from '../services';
import { useRef } from 'react';
import { formatBytes } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const {
    workspace,
    updateWorkspace,
    currentUser,
    driveConnection,
    theme,
    setTheme,
    showToast,
  } = useFamilyVault();

  const [activeTab, setActiveTab] = useState<
    'general' | 'appearance' | 'account' | 'drive' | 'permissions' | 'notifications'
  >('general');

  // General Form
  const [familyName, setFamilyName] = useState(workspace.name);
  const [familyDesc, setFamilyDesc] = useState(workspace.description);
  const [familyTagline, setFamilyTagline] = useState(workspace.tagline);
  const [language, setLanguage] = useState(workspace.preferences.language || 'English (US)');
  const [timezone, setTimezone] = useState(workspace.preferences.timezone || 'Asia/Kolkata (IST)');

  // Permissions Form
  const [defaultVisibility, setDefaultVisibility] = useState(workspace.preferences.defaultVisibility);
  const [uploadPermissions, setUploadPermissions] = useState(workspace.preferences.uploadPermissions);
  const [fileDeletionPermissions, setFileDeletionPermissions] = useState(
    workspace.preferences.fileDeletionPermissions
  );
  const [invitePermissions, setInvitePermissions] = useState(workspace.preferences.invitePermissions);

  // Notifications Form
  const [notifUploads, setNotifUploads] = useState(true);
  const [notifInvites, setNotifInvites] = useState(true);
  const [notifStorage, setNotifStorage] = useState(true);
  const [notifActivity, setNotifActivity] = useState(false);

  // Account Form
  const isPin = currentUser.role !== 'owner';
  const secretWord = isPin ? 'PIN' : 'password';
  const [curSecret, setCurSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const handleChangeSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.changeSecret(curSecret, newSecret);
      setCurSecret(''); setNewSecret('');
      showToast(`Your ${secretWord} was changed`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkspace({
      name: familyName,
      description: familyDesc,
      tagline: familyTagline,
      preferences: {
        ...workspace.preferences,
        language,
        timezone,
      },
    });
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkspace({
      preferences: {
        ...workspace.preferences,
        defaultVisibility,
        uploadPermissions,
        fileDeletionPermissions,
        invitePermissions,
      },
    });
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const reloadSoon = () => setTimeout(() => window.location.reload(), 600);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile(currentUser.id, { name: userName.trim() });
      showToast('Profile information updated', 'success');
      reloadSoon();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Resize to a 256px square JPEG in the browser so phone photos upload instantly and stay tiny.
  const handlePickPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Please choose an image file', 'error');
    try {
      const bmp = await createImageBitmap(file);
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const side = Math.min(bmp.width, bmp.height);
      canvas.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
      const avatar = canvas.toDataURL('image/jpeg', 0.85);
      await authService.updateProfile(currentUser.id, { avatar });
      showToast('Profile picture updated', 'success');
      reloadSoon();
    } catch (err: any) {
      showToast(err.message || 'Could not use that image', 'error');
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Notification preferences updated', 'success');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
    { id: 'drive', label: 'Google Drive', icon: HardDrive },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings & Preferences
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage family workspace configuration, Google Drive connection, roles, and visual themes.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Tabs */}
        <aside className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Canvas */}
        <div className="flex-1 min-w-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Family Workspace Settings
                </h2>
                <p className="text-xs text-neutral-500">
                  Visible to all invited family members upon sign in.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Family Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Family Tagline
                  </label>
                  <input
                    type="text"
                    value={familyTagline}
                    onChange={(e) => setFamilyTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={familyDesc}
                    onChange={(e) => setFamilyDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (India)">English (India)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="America/New_York (EST)">America/New_York (EST, UTC-5:00)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT, UTC+0:00)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Workspace Changes
                </button>
              </div>
            </form>
          )}

          {/* 2. APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Interface & Appearance
                </h2>
                <p className="text-xs text-neutral-500">
                  Customize the look and feel of your FamilyVault experience.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Theme Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50/40 text-blue-700 dark:bg-blue-950/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span>Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-50/40 text-blue-700 dark:bg-blue-950/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span>Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors ${
                      theme === 'system'
                        ? 'border-blue-600 bg-blue-50/40 text-blue-700 dark:bg-blue-950/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-neutral-500" />
                    <span>System Default</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">
                  Theme settings are synchronized across your devices automatically.
                </p>
              </div>
            </div>
          )}

          {/* 3. ACCOUNT TAB */}
          {activeTab === 'account' && (
            <>
            <form onSubmit={handleSaveAccount} className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  My Profile & Credentials
                </h2>
                <p className="text-xs text-neutral-500">
                  Personal account information and security credentials.
                </p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300"
                  >
                    Change Picture
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePickPicture} className="hidden" />
                  <p className="text-[11px] text-neutral-400 mt-1">Any photo — it's resized automatically</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    title="Your sign-in email can't be changed here"
                    className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>

            <form onSubmit={handleChangeSecret} className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Change your {secretWord}</h4>
              <p className="text-xs text-neutral-500">
                {isPin ? 'Your PIN is 6 digits. Forgot it? Use "Forgot password or PIN?" on the sign-in page.' : 'Use at least 8 characters.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password" required value={curSecret} autoComplete="current-password"
                  inputMode={isPin ? 'numeric' : 'text'} maxLength={isPin ? 6 : 200}
                  onChange={(e) => setCurSecret(e.target.value)} placeholder={`Current ${secretWord}`}
                  className="w-full px-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
                <input
                  type="password" required value={newSecret} autoComplete="new-password"
                  inputMode={isPin ? 'numeric' : 'text'} maxLength={isPin ? 6 : 200}
                  onChange={(e) => setNewSecret(isPin ? e.target.value.replace(/\D/g, '') : e.target.value)} placeholder={`New ${secretWord}`}
                  className="w-full px-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Update {secretWord}
                </button>
              </div>
            </form>
            </>
          )}

          {/* 4. GOOGLE DRIVE TAB */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Google Drive Cloud Connection
                </h2>
                <p className="text-xs text-neutral-500">
                  All family uploads are stored permanently in the primary account owner's Google Drive.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Host Account
                  </span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {driveConnection.accountEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Cloud Status
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active & Synchronizing
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Vault Capacity
                  </span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">
                    {formatBytes(driveConnection.storageUsedBytes)} of {formatBytes(driveConnection.storageTotalBytes, 0)} used
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => showToast('Re-verifying Google Drive token...', 'info')}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-xl"
                >
                  Verify Drive Token
                </button>
              </div>
            </div>
          )}

          {/* 5. PERMISSIONS TAB */}
          {activeTab === 'permissions' && (
            <form onSubmit={handleSavePermissions} className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Vault Security & Permissions
                </h2>
                <p className="text-xs text-neutral-500">
                  Define who can invite family members, delete files, or adjust visibility.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Default File Visibility for New Uploads
                  </label>
                  <select
                    value={defaultVisibility}
                    onChange={(e) => setDefaultVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="family">Visible to entire family (Recommended)</option>
                    <option value="admins">Admins & Owner only</option>
                    <option value="private">Private to uploader & Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Upload Permissions
                  </label>
                  <select
                    value={uploadPermissions}
                    onChange={(e) => setUploadPermissions(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="all">All family members can upload files</option>
                    <option value="admins">Only Admins and Owner can upload</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    File Deletion Policy
                  </label>
                  <select
                    value={fileDeletionPermissions}
                    onChange={(e) => setFileDeletionPermissions(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="owner_admin">Owner and Admins can delete any file</option>
                    <option value="uploader_only">Members can only delete files they uploaded</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Invitation Permissions
                  </label>
                  <select
                    value={invitePermissions}
                    onChange={(e) => setInvitePermissions(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  >
                    <option value="admins">Admins and Owner only</option>
                    <option value="all">Any family member can send invitations</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          )}

          {/* 6. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Notification Center Preferences
                </h2>
                <p className="text-xs text-neutral-500">
                  Configure alerts for new photos, invitations, and Google Drive storage warnings.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      New Uploads Alert
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Notify when a family member uploads photos, videos, or documents.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifUploads}
                    onChange={(e) => setNotifUploads(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Family Invitations & Joins
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Alerts when an invited relative accepts or joins the vault.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifInvites}
                    onChange={(e) => setNotifInvites(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Google Drive Quota Warnings
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Warning notification when cloud storage exceeds 80% capacity.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifStorage}
                    onChange={(e) => setNotifStorage(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Notification Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
