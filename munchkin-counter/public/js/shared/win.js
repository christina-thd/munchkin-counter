// The end of a game: the dashboard's win popup and the phone's win card share this markup.
import { fetchLog } from './api.js';
import { avatarHtml } from './avatars.js';
import { levelReport } from './report.js';
import { winStory } from './win-story.js';

/**
 * The story of the current game's win, from its activity log (without the log: a general line).
 * @param {string} gameId
 * @param {import('./rules.js').Player[]} players
 */
export async function loadWinStory(gameId, players) {
  const log = await fetchLog(gameId).catch(() => null);
  return winStory(log ? levelReport(log.entries, log.players) : null, players);
}

/**
 * @param {ReturnType<typeof winStory>} story
 * @param {string} title   HTML
 * @param {{ deaths?: boolean }} [show]   deaths: the number of deaths beside the time
 */
export function winHtml(story, title, { deaths = true } = {}) {
  const facts = [story.time && `⏱ ${story.time}`, deaths && story.deaths != null && `💀 ${story.deaths}`].filter(Boolean);
  return `
    <div class="win">
      <div class="win-avatars">
        ${story.winners.map((p) => avatarHtml(p.avatar, { className: 'win-avatar' })).join('')}
        <span class="win-crown" aria-hidden="true">👑</span>
      </div>
      <div class="win-title">${title}</div>
      <p class="win-line">${story.line}</p>
      ${facts.length ? `<div class="win-facts">${facts.map((fact) => `<span>${fact}</span>`).join('')}</div>` : ''}
    </div>`;
}
