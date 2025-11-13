import type { Contact } from '../types';

// Весовая модель: ФИО=2 (1 если только имя или только фамилия), Телефон=2,
// Организация=3, ДР=3, прочие (email/notes) =1
export function calcCompleteness(c: Contact): number {
  let earned = 0;
  const max = 2 + 2 + 3 + 3 + 1 + 1; // fio + phone + org + birthday + email + notes

  const fioFull = (c.firstName?.trim() ? 1 : 0) + (c.lastName?.trim() ? 1 : 0);
  if (fioFull === 2) earned += 2; else if (fioFull === 1) earned += 1;
  if (c.phones && c.phones.length) earned += 2;
  if (c.organization) earned += 3;
  if (c.birthday) earned += 3;
  if (c.emails && c.emails.length) earned += 1;
  if (c.notes && c.notes.trim()) earned += 1;

  return Math.max(0, Math.min(100, Math.round((earned / max) * 100)));
}

