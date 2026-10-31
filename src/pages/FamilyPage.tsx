import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  MoreVertical,
  Check,
  Clock,
  Trash2,
  Send,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { User, UserRole } from '../types';
import { formatDate } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { authService, familyService } from '../services';

export const FamilyPage: React.FC = () => {
  const { members, currentUser, workspace, refreshData, showToast } = useFamilyVault();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [emailError, setEmailError] = useState('');

  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      await familyService.inviteMember(inviteEmail, inviteRole, inviteRelationship);
      await refreshData();
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRelationship('');
      showToast(`Invitation sent to ${inviteEmail}`, 'success');
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await familyService.changeRole(memberId, newRole);
      await refreshData();
      showToast('Role updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleResendInvite = async (member: User) => {
    await familyService.resendInvite(member.id);
    showToast(`Invitation resent to ${member.email}`, 'info');
  };

  const handleResetPin = async (member: User) => {
    try {
      const r = await authService.sendResetLink(member.id);
      if (r.emailed) showToast(`PIN reset link emailed to ${member.email}`, 'success');
      else {
        await navigator.clipboard?.writeText(r.resetUrl || '').catch(() => {});
        showToast('Email is not set up — reset link copied to your clipboard', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not send reset link', 'error');
    }
  };

  const handleRevokeInvite = async (member: User) => {
    await familyService.revokeInvite(member.id);
    await refreshData();
    showToast(`Invitation for ${member.email} revoked`, 'info');
  };

  const handleRemoveMember = async () => {
    if (memberToRemove) {
      try {
        await familyService.removeMember(memberToRemove.id);
        await refreshData();
        setMemberToRemove(null);
        showToast(`Removed ${memberToRemove.name} from family workspace`, 'info');
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Family Members & Access
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {members.length} members connected to {workspace.name} vault. All uploads are stored in the owner's Google Drive.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Family Member</span>
          </button>
        )}
      </div>

      {/* Primary Owner Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-neutral-900 dark:to-neutral-850 border border-blue-200/60 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Primary Account Owner: {workspace.ownerName}
              </h3>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">
                Owner
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Connected Google Drive storage host. All member files sync directly to this account.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-500 shrink-0">
          Created: {formatDate(workspace.createdAt)}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Family Roster ({members.length})
          </h3>
          <span className="text-xs text-neutral-400">Owner &bull; Admin &bull; Member</span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
            >
              {/* Member Profile */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                  />
                  {member.status === 'pending' && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-neutral-900"
                      title="Invitation pending"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {member.name}
                    </h4>
                    {member.id === currentUser.id && (
                      <span className="text-[10px] text-blue-600 font-semibold">(You)</span>
                    )}
                    {member.status === 'pending' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        Invite Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {member.relationship && <span>{member.relationship} · </span>}
                    <span>Joined {formatDate(member.joinedAt)}</span>
                  </p>
                </div>
              </div>

              {/* Actions & Role Select */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Role Dropdown */}
                {isOwnerOrAdmin && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none capitalize"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize">
                    {member.role}
                  </span>
                )}

                {/* Status Specific Actions */}
                {member.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResendInvite(member)}
                      className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1"
                      title="Resend invitation email"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Resend</span>
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(member)}
                      className="p-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                      title="Revoke invitation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  member.role !== 'owner' &&
                  isOwnerOrAdmin && (
                    <>
                    <button
                      onClick={() => handleResetPin(member)}
                      className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                      title="Email this member a link to set a new PIN"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitation Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl animate-in fade-in">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Invite Family Member
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              They will receive an invitation email to create their account and upload directly into your family Google Drive vault.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="e.g. cousin.aman@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Relationship (Optional)
                </label>
                <input
                  type="text"
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  placeholder="e.g. Cousin, Grandparent, Daughter..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="member">Member — Can upload photos, videos & view vault</option>
                  <option value="admin">Admin — Can invite members and manage folder vaults</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        title="Remove Member?"
        message={`Are you sure you want to remove ${memberToRemove?.name} from ${workspace.name}? They will no longer have access to upload or view files.`}
        confirmLabel="Remove Member"
        isDestructive
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
};
