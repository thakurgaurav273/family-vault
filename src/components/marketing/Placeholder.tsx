import React from 'react';
import { siteConfig } from '../../config/site';

/** Renders an owner-supplied value, or a visibly marked placeholder so nothing is silently invented. */
export const Fill: React.FC<{ value?: string; env: string }> = ({ value, env }) =>
  value ? <>{value}</> : (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.85em] font-semibold text-amber-900" title={`Owner: set ${env} at build time`}>
      [Owner: set {env}]
    </mark>
  );

export const OperatorName: React.FC = () => <Fill value={siteConfig.operatorName} env="VITE_OPERATOR_NAME" />;

export const ContactEmail: React.FC = () =>
  siteConfig.supportEmail
    ? <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">{siteConfig.supportEmail}</a>
    : <Fill env="VITE_SUPPORT_EMAIL" />;
