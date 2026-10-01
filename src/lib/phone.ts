/**
 * "+15551234567" as "(555) 123-4567"; any other country left as stored.
 * Shared by the profile and the checkout, which both show who is signed in.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return us ? `(${us[1]}) ${us[2]}-${us[3]}` : phone;
}
