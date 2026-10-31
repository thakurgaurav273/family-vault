import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import { useFamilyVault } from '../context/FamilyVaultContext';
import { authService } from '../services';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workspace, showToast, refreshData, members, switchUser } = useFamilyVault();

  const inviteToken = searchParams.get('invite') || '';
  const isInvite = searchParams.get('mode') === 'invite' || !!inviteToken;
  const resetToken = searchParams.get('reset') || '';
  const [view, setView] = useState<'login' | 'register' | 'invite' | 'forgot' | 'reset'>(
    resetToken ? 'reset' : isInvite ? 'invite' : searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  // Family members sign in with a 6-digit PIN; the owner uses a password. The link tells us which.
  const [kind, setKind] = useState<'pin' | 'password'>('pin');
  const [linkEmail, setLinkEmail] = useState('');
  const [sent, setSent] = useState(false);
  const isPin = kind === 'pin';
  const secretLabel = isPin ? 'PIN' : 'Password';
  const secretProps = isPin
    ? ({ type: 'password', inputMode: 'numeric', pattern: '\\d{6}', maxLength: 6, autoComplete: 'new-password', placeholder: '6-digit PIN' } as const)
    : ({ type: 'password', autoComplete: 'new-password', placeholder: '••••••••' } as const);

  useEffect(() => {
    const t = view === 'invite' ? inviteToken : view === 'reset' ? resetToken : '';
    if (!t) return;
    authService.lookup(view === 'invite' ? 'invite' : 'reset', t)
      .then((r) => { setKind(r.kind); setLinkEmail(r.email); })
      .catch((e) => setError(e.message));
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.forgot(email);
    setSent(true);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError(`${secretLabel}s do not match`);
    try {
      await authService.reset(resetToken, password);
      showToast(`${secretLabel} updated`, 'success');
      window.location.assign('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relationship, setRelationship] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await authService.login(email, password);
      void user;
      window.location.assign('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const user = await authService.register(name, email, password);
      void user;
      showToast('Account created successfully!', 'success');
      window.location.assign('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError(`${secretLabel}s do not match`);
    try {
      const user = await authService.acceptInvitation(inviteToken, name || 'Family Member', password);
      void user;
      showToast(`Welcome to the ${workspace.name} vault!`, 'success');
      window.location.assign('/');
    } catch (err: any) {
      setError(err.message || 'Could not accept invitation');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7 stroke-[2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FamilyVault</h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            {workspace.tagline || 'Every memory. Every document. One family home.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-base font-bold">Reset your PIN or password</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Enter your email and we'll send you a link to choose a new one.
                </p>
              </div>
              {sent ? (
                <p className="text-xs text-emerald-600 text-center">
                  If that email belongs to a family member, a reset link is on its way. It expires in 30 minutes.
                </p>
              ) : (
                <>
                  <input
                    type="email" required autoComplete="email" inputMode="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                  <button type="submit" className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                    Send reset link
                  </button>
                </>
              )}
              <button type="button" onClick={() => setView('login')} className="block mx-auto text-xs text-blue-600 hover:underline">
                Back to sign in
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-base font-bold">Choose a new {secretLabel}</h2>
                {linkEmail && <p className="text-xs text-neutral-500 mt-1">{linkEmail}</p>}
              </div>
              <input
                {...secretProps} required value={password}
                onChange={(e) => setPassword(isPin ? e.target.value.replace(/\D/g, '') : e.target.value)}
                className="w-full px-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
              />
              <input
                {...secretProps} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(isPin ? e.target.value.replace(/\D/g, '') : e.target.value)}
                placeholder={`Confirm ${secretLabel}`}
                className="w-full px-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
              />
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button type="submit" className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                Save {secretLabel}
              </button>
            </form>
          )}

          {/* View: INVITATION ACCEPTANCE */}
          {view === 'invite' && (
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  You've been invited
                </span>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  Join the {workspace.name} Vault
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Invited by {workspace.ownerName}. Backed up directly to Google Drive.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Create a {secretLabel}{isPin ? ' (6 digits)' : ''}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    {...secretProps}
                    required
                    value={password}
                    onChange={(e) => setPassword(isPin ? e.target.value.replace(/\D/g, '') : e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm {secretLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    {...secretProps}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(isPin ? e.target.value.replace(/\D/g, '') : e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Accept Invitation & Enter Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* View: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="pb-1">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Family Sign In
                </h2>
                <p className="text-xs text-neutral-500">
                  Access your family's private document & memories vault.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="thakurgaurav273@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Password or PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => { setError(''); setSent(false); setView('forgot'); }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password or PIN?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-neutral-500">
                <span>Invited to a family? </span>
                <button
                  type="button"
                  onClick={() => setView('invite')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Accept invitation
                </button>
                <span> or </span>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Create new family
                </button>
              </div>
            </form>
          )}

          {/* View: REGISTER */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="pb-1">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Create Family Vault
                </h2>
                <p className="text-xs text-neutral-500">
                  Set up a private storage workspace for your family.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="thakurgaurav273@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue to Setup Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-neutral-500">
                <span>Already have a vault? </span>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
