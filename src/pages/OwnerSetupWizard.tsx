import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { familyService, googleDriveService } from '../services';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  HardDrive,
  Users,
  Settings,
  Sparkles,
  Cloud,
  CheckCircle2,
  Mail,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { formatBytes } from '../utils/formatters';

export const OwnerSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { workspace, updateWorkspace, driveConnection, syncDriveNow, showToast } =
    useFamilyVault();

  const { currentUser } = useFamilyVault();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(Number(searchParams.get('step')) || 1);

  useEffect(() => {
    if (currentUser?.role !== 'owner' || ((workspace.setupComplete || driveConnection.isConnected) && !searchParams.get('step'))) navigate('/', { replace: true });
  }, [currentUser?.role, workspace.setupComplete, driveConnection.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get('drive') === 'error') showToast('Google Drive connection failed. Check server Google credentials.', 'error');
    if (searchParams.get('drive') === 'connected') showToast('Google Drive connected!', 'success');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: Workspace info
  const [familyName, setFamilyName] = useState(workspace.name || '');
  const [familyDesc, setFamilyDesc] = useState(
    workspace.description || 'Our private family sanctuary for memories and essential records.'
  );

  // Step 2: Drive connection
  const isDriveConnected = driveConnection.isConnected;
  const [isConnecting, setIsConnecting] = useState(false);

  // Step 3: Preferences
  const [defaultVisibility, setDefaultVisibility] = useState(
    workspace.preferences.defaultVisibility || 'family'
  );
  const [uploadPermissions, setUploadPermissions] = useState(
    workspace.preferences.uploadPermissions || 'all'
  );

  // Step 4: Family Member Invitations
  const [invites, setInvites] = useState<Array<{ email: string; role: 'admin' | 'member' }>>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'member'>('member');

  const steps = [
    { number: 1, label: 'Workspace' },
    { number: 2, label: 'Connect Drive' },
    { number: 3, label: 'Preferences' },
    { number: 4, label: 'Invite Family' },
    { number: 5, label: 'Complete' },
  ];

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    await googleDriveService.connectDrive('setup');
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail.trim()) return;
    setInvites([...invites, { email: newInviteEmail.trim(), role: newInviteRole }]);
    setNewInviteEmail('');
  };

  const handleRemoveInvite = (idx: number) => {
    setInvites(invites.filter((_, i) => i !== idx));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      await updateWorkspace({ name: familyName, description: familyDesc });
    }
    if (currentStep === 3) {
      await updateWorkspace({
        preferences: {
          ...workspace.preferences,
          defaultVisibility,
          uploadPermissions,
        },
      });
    }
    if (currentStep === 2 && !isDriveConnected) {
      showToast('Connect Google Drive to continue', 'error');
      return;
    }
    if (currentStep === 4) {
      const failed: string[] = [];
      for (const inv of invites) {
        try { await familyService.inviteMember(inv.email, inv.role); } catch { failed.push(inv.email); }
      }
      if (failed.length) showToast(`Could not invite: ${failed.join(', ')}`, 'error');
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      await updateWorkspace({ setupComplete: true });
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Wizard Header */}
      <div className="max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block">FamilyVault</span>
              <span className="text-[11px] text-neutral-400 block">Owner Setup Wizard</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            Skip to Dashboard
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between my-8 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 dark:bg-neutral-800 z-0" />
          {steps.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            return (
              <div key={s.number} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'bg-white dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium hidden sm:block ${
                    isCurrent ? 'text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Step Box */}
      <div className="max-w-xl w-full mx-auto my-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* STEP 1: CREATE FAMILY WORKSPACE */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step 1 of 5
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Name Your Family Vault
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Give your private sanctuary a warm, recognizable family name.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Family Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. The Sharmas..."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description & Welcome Note
                </label>
                <textarea
                  rows={3}
                  value={familyDesc}
                  onChange={(e) => setFamilyDesc(e.target.value)}
                  placeholder="Preserving our precious memories, family trips, and essential documents..."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONNECT GOOGLE DRIVE */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step 2 of 5
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Connect Your Google Drive
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Why Google Drive? All family photos, videos, and documents stay under your private control and storage ownership.
              </p>
            </div>

            {/* Integration Card */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Google Drive Cloud Storage
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isDriveConnected ? `Host: ${driveConnection.accountEmail}` : 'Not connected yet'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Private encrypted directory (/FamilyVault)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Invited members upload straight to your Google Drive quota</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>You retain 100% data sovereignty and ownership</span>
                </div>
              </div>

              <div className="pt-2">
                {isDriveConnected ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Google Drive Successfully Connected
                    </span>
                    <span className="text-[10px] text-emerald-600">Active</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{isConnecting ? 'Authorizing with Google Drive...' : 'Connect Google Drive'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIGURE PREFERENCES */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step 3 of 5
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Configure Vault Preferences
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Set baseline privacy, upload rules, and folder categorization.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Default File Visibility
                </label>
                <select
                  value={defaultVisibility}
                  onChange={(e) => setDefaultVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                >
                  <option value="family">Visible to entire family (Recommended)</option>
                  <option value="admins">Admins & Owner only</option>
                  <option value="private">Private (Uploader + Owner only)</option>
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Uploaders can always override visibility per file.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Member Upload Permissions
                </label>
                <select
                  value={uploadPermissions}
                  onChange={(e) => setUploadPermissions(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">All family members can upload photos, videos & docs</option>
                  <option value="admins">Only designated admins can upload</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold block mb-0.5 text-blue-800 dark:text-blue-300">
                  Pre-configured Shared Folders
                </span>
                <span className="text-[11px]">
                  Family Trips &bull; Festivals &bull; Important Documents &bull; Weddings &bull; Childhood Memories
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INVITE FAMILY MEMBERS */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step 4 of 5
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Invite Family Members
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Invite your parents, siblings, or spouse to start uploading memories.
              </p>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddInvite} className="flex gap-2 text-xs">
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="relative.email@gmail.com"
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100"
              />
              <select
                value={newInviteRole}
                onChange={(e) => setNewInviteRole(e.target.value as any)}
                className="px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-semibold rounded-xl hover:bg-neutral-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Pending Invite Queue */}
            <div className="space-y-2 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 max-h-48 overflow-y-auto">
              {invites.map((inv, idx) => (
                <div
                  key={inv.email}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {inv.email}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-neutral-400">
                      ({inv.role})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveInvite(idx)}
                    className="text-neutral-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETION SCREEN */}
        {currentStep === 5 && (
          <div className="text-center space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {familyName} Vault Is Ready!
            </h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Your Google Drive storage is connected, preferences are secured, and invitation links have been prepared for family members.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Family Workspace</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{familyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cloud Storage</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{driveConnection.accountEmail || 'Not connected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Invited Relatives</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{invites.length} pending invitations</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800 mt-8 flex items-center justify-between">
          {currentStep > 1 && currentStep < 5 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors ml-auto"
          >
            <span>{currentStep === 5 ? 'Open Family Vault' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-neutral-400 py-4">
        FamilyVault &bull; Every memory. Every document. One family home.
      </div>
    </div>
  );
};
