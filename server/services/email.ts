import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
export const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export async function sendInviteEmail(to: string, inviter: string, family: string, url: string): Promise<boolean> {
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'FamilyVault <onboarding@resend.dev>',
    to,
    subject: `${inviter} invited you to the ${family} FamilyVault`,
    html: `<div style="font-family:sans-serif;max-width:480px"><h2>You're invited to ${esc(family)}</h2>
      <p>${esc(inviter)} invited you to share family photos, videos and documents on FamilyVault.</p>
      <p><a href="${esc(url)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Accept invitation</a></p>
      <p style="color:#666;font-size:12px">Or open: ${esc(url)}</p></div>`,
  });
  if (error) console.error('Resend error:', error.message);
  return !error;
}

export async function sendResetEmail(to: string, family: string, kind: 'password' | 'pin', url: string): Promise<boolean> {
  if (!resend) return false;
  const what = kind === 'pin' ? 'PIN' : 'password';
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'FamilyVault <onboarding@resend.dev>',
    to,
    subject: `Reset your ${family} FamilyVault ${what}`,
    html: `<div style="font-family:sans-serif;max-width:480px"><h2>Reset your ${what}</h2>
      <p>Use the button below to choose a new ${what}. The link works once and expires in 30 minutes.</p>
      <p><a href="${esc(url)}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new ${what}</a></p>
      <p style="color:#666;font-size:12px">If you didn't ask for this, ignore this email — your ${what} is unchanged.</p></div>`,
  });
  if (error) console.error('Resend error:', error.message);
  return !error;
}

export async function sendVerifyEmail(to: string, code: string): Promise<boolean> {
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'FamilyVault <onboarding@resend.dev>',
    to,
    subject: `${code} is your FamilyVault verification code`,
    html: `<div style="font-family:sans-serif;max-width:480px"><h2>Verify your email</h2>
      <p>Enter this code to finish creating your FamilyVault. It expires in 10 minutes.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:16px 0">${esc(code)}</p>
      <p style="color:#666;font-size:12px">If you didn't try to create a FamilyVault, ignore this email and nothing will happen.</p></div>`,
  });
  if (error) console.error('Resend error:', error.message);
  return !error;
}
