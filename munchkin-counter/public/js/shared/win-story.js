// The win popup's text: who won, one fun line about how the game went, and how long it took.
// Pure (no DOM), so it can be tested in Node.
import { escapeHtml } from './dom.js';
import { formatElapsed, levelAt } from './report.js';
import { MAX_LEVEL, winnersOf } from './rules.js';

const COMEBACK_FROM = 3;       // levels behind the leader at some point
const BLOWOUT_BY = 4;          // levels ahead of the next best at the end
const MARATHON_MS = 150 * 60_000;

// One of these, picked by what stood out in the game (most remarkable first). Names are already HTML.
const STORY = {
  comeback: ({ who, behind }) => [
    `${who} was ${behind} levels behind at one point. Never count out a munchkin.`,
    `From ${behind} levels behind to the crown. Somebody stopped paying attention.`,
    `${who} came back from ${behind} levels down. The rest of you got comfortable.`,
  ],
  blowout: ({ gap }) => [
    `Won by ${gap} levels. The rest of you should have cursed harder.`,
    `Not even close: ${gap} levels clear. Next time, team up sooner.`,
  ],
  marathon: ({ time }) => [
    `${time} of backstabbing, and it finally paid off.`,
    `After ${time}, the dungeon is finally closed. Go stretch your legs.`,
  ],
  plain: () => [
    `Another dungeon looted, another set of friendships ruined.`,
  ],
};

/** Most levels the winner was ever behind the leader, until they won. */
function mostBehind(report, winnerId) {
  const track = report.tracks.find((t) => t.playerId === winnerId);
  if (!track) return 0;
  const until = report.winner?.at ?? report.end;
  const times = [...new Set(report.tracks.flatMap((t) => t.points.map((p) => p.at)))].filter((at) => at <= until);
  let most = 0;
  for (const at of times) {
    const mine = levelAt(track, at);
    if (mine == null) continue;
    const top = Math.max(...report.tracks.map((t) => levelAt(t, at) ?? 0));
    most = Math.max(most, top - mine);
  }
  return most;
}

/**
 * @param {ReturnType<typeof import('./report.js').levelReport> | null} report   null if the log couldn't be loaded
 * @param {import('./rules.js').Player[]} players   the game's players now
 * @param {() => number} [random]
 * @returns {{ kind: string, winners: import('./rules.js').Player[], line: string, time: string | null }}
 *          time as text ("1 h 30 min"); null without the log
 */
export function winStory(report, players, random = Math.random) {
  const winners = winnersOf(players);
  const pick = (kind, ctx) => {
    const lines = STORY[kind](ctx);
    return { kind, line: lines[Math.floor(random() * lines.length)] };
  };
  const who = winners.map((p) => `<b>${escapeHtml(p.name)}</b>`).join(' & ');

  const runnerUp = players.filter((p) => p.level < MAX_LEVEL).sort((a, b) => b.level - a.level)[0];
  if (!report || !winners.length) return { winners, ...pick('plain', {}), time: null };

  const ms = (report.winner?.at ?? report.end) - report.start;
  const time = ms < 60_000 ? 'under a minute' : formatElapsed(ms);
  const behind = mostBehind(report, winners[0].id);
  const gap = runnerUp ? MAX_LEVEL - runnerUp.level : 0;

  let story;
  if (behind >= COMEBACK_FROM) story = pick('comeback', { who, behind });
  else if (gap >= BLOWOUT_BY) story = pick('blowout', { gap });
  else if (ms > MARATHON_MS) story = pick('marathon', { time });
  else story = pick('plain', {});
  return { winners, ...story, time };
}
