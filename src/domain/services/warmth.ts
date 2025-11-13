import type { Interaction } from '../types';

// Экспоненциальный спад и события: τ=60 дней; meeting +25, call/chat +15,
// email/other +8, поздравление с ДР +10, завершение nextStep +10; максимум 100
export function applyInteractionWarmth(prev: number, interaction: Interaction, nowIso: string): number {
  let add = 0;
  switch (interaction.channel) {
    case 'meeting':
      add = 25; break;
    case 'call':
    case 'chat':
      add = 15; break;
    case 'email':
    case 'other':
      add = 8; break;
  }
  if (interaction.nextStepDone) add += 10;
  // birthday congrats heuristic
  if (/(birthday|день рождения|\bдр\b)/i.test(interaction.summary ?? '')) add += 10;
  const decayed = decayWarmth(prev, interaction.date, nowIso);
  return Math.min(100, Math.max(0, Math.round(decayed + add)));
}

export function decayWarmth(prev: number, lastAtIso: string, nowIso: string, tauDays: number = 60): number {
  const last = Date.parse(lastAtIso);
  const now = Date.parse(nowIso);
  if (!isFinite(last) || !isFinite(now)) return prev;
  const dtDays = Math.max(0, (now - last) / (1000 * 60 * 60 * 24));
  const k = Math.exp(-dtDays / tauDays);
  return prev * k;
}

