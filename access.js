// The owner is identified by Firebase UID, never by a client-editable email.
export const OWNER_UID = 'Wd2zH6GVxphMtPD0Z6nld5VfF872';
export const normalizeEmail = value => String(value||'').trim().toLowerCase();
export function canUseCloud(identity,grant){
  return !!identity && (identity.uid===OWNER_UID ||
    (identity.emailVerified===true && !!normalizeEmail(identity.email) && grant?.enabled===true));
}
