// Draws the player avatars, one SVG token each, into public/img/avatars/. Run: node art/avatars.mjs
// Every token: a colored disc, a faint inner gold ring, a cream silhouette outlined in the disc's color, a gold rim.
// The ids must match AVATARS in public/js/shared/rules.js (a test checks every one has its file).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'avatars');
const CREAM = '#f3e3bf';
const GOLD = '#e8b54a';

const token = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<clipPath id="c"><circle cx="50" cy="50" r="47"/></clipPath>
<circle cx="50" cy="50" r="47" fill="${bg}"/>
<circle cx="50" cy="50" r="41" fill="none" stroke="${GOLD}" stroke-width="2" opacity=".6"/>
<g clip-path="url(#c)" fill="${CREAM}" stroke="${bg}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
${body.trim().split('\n').map((l) => l.trim()).join('\n').replaceAll('BG', bg)}
</g>
<circle cx="50" cy="50" r="47" fill="none" stroke="${GOLD}" stroke-width="3"/>
</svg>
`;

// Features drawn in the disc's color ("BG"): eyes, mouths, cut lines.
const AVATARS = {
  // ----- races -----
  elf: ['#2f6b3c', `
    <path d="M20 100 Q22 82 50 80 Q78 82 80 100 Z"/>
    <rect x="45" y="66" width="10" height="16"/>
    <path d="M34 44 Q27 68 29 90 L41 90 Q37 68 38 50 Z"/><path d="M66 44 Q73 68 71 90 L59 90 Q63 68 62 50 Z"/>
    <path d="M36 51 L11 34 L37 60 Z"/><path d="M64 51 L89 34 L63 60 Z"/>
    <ellipse cx="50" cy="55" rx="15" ry="18"/>
    <path d="M34.5 54 Q32 31 50 30 Q68 31 65.5 54 Q63 42 50 41 Q37 42 34.5 54 Z"/>
    <path d="M50 31 L50 40" fill="none" stroke-width="2"/>
    <path d="M37 47 Q50 41.5 63 47" fill="none" stroke-width="2"/>
    <g stroke="none" fill="BG"><path d="M50 40 L52.6 43.5 L50 47 L47.4 43.5 Z"/>
      <ellipse cx="44" cy="56.5" rx="2.2" ry="2.9"/><ellipse cx="56" cy="56.5" rx="2.2" ry="2.9"/></g>
    <path d="M40 51 L46.5 52 M53.5 52 L60 51" fill="none" stroke-width="2"/>
    <path d="M46 64 Q50 66.5 54 64" fill="none"/>`],
  dwarf: ['#5b6672', `
    <path d="M14 100 Q16 80 50 78 Q84 80 86 100 Z"/>
    <ellipse cx="50" cy="53" rx="19" ry="18"/>
    <path d="M30 46 Q30 22 50 22 Q70 22 70 46 Z"/>
    <rect x="27" y="41" width="46" height="7" rx="3.5"/>
    <path d="M31 55 Q28 88 50 94 Q72 88 69 55 Q62 65 50 64 Q38 65 31 55 Z"/>
    <path d="M40 64 Q45 59 50 62 Q55 59 60 64" fill="none"/>
    <path d="M44 74 L45 86 M50 72 L50 88 M56 74 L55 86" fill="none" stroke-width="2"/>
    <g stroke="none" fill="BG"><circle cx="43" cy="53.5" r="2.5"/><circle cx="57" cy="53.5" r="2.5"/></g>`],
  halfling: ['#9a6a2a', `
    <path d="M20 100 Q22 82 50 80 Q78 82 80 100 Z"/>
    <rect x="44" y="66" width="12" height="16"/>
    <circle cx="31" cy="56" r="6"/><circle cx="69" cy="56" r="6"/>
    <ellipse cx="50" cy="55" rx="18" ry="19"/>
    <circle cx="35" cy="47" r="7"/><circle cx="37" cy="38" r="7"/><circle cx="45" cy="33" r="7"/>
    <circle cx="54" cy="32" r="7"/><circle cx="62" cy="37" r="7"/><circle cx="65" cy="46" r="7"/>
    <g stroke="none" fill="BG"><circle cx="44" cy="57" r="2.4"/><circle cx="56" cy="57" r="2.4"/></g>
    <path d="M42 64 Q50 71 58 64" fill="none"/>`],
  gnome: ['#2f6a8f', `
    <path d="M22 100 Q24 82 50 80 Q76 82 78 100 Z"/>
    <ellipse cx="50" cy="60" rx="15" ry="15"/>
    <path d="M36 62 Q34 90 50 94 Q66 90 64 62 Q57 70 50 69 Q43 70 36 62 Z"/>
    <path d="M33 52 Q38 30 50 10 Q54 4 58 10 Q62 32 67 52 Z"/>
    <circle cx="50" cy="64" r="5"/>
    <path d="M41 69 Q46 65 50 68 Q54 65 59 69" fill="none"/>
    <g stroke="none" fill="BG"><circle cx="44.5" cy="58" r="2.2"/><circle cx="55.5" cy="58" r="2.2"/></g>`],
  orc: ['#6e2c2c', `
    <path d="M12 100 Q14 80 50 77 Q86 80 88 100 Z"/>
    <path d="M17 86 L21 71 L28 84 Z M83 86 L79 71 L72 84 Z"/>
    <rect x="38" y="64" width="24" height="16"/>
    <path d="M32 48 L18 39 L32 59 Z"/><path d="M68 48 L82 39 L68 59 Z"/>
    <path d="M31 41 Q31 29 50 29 Q69 29 69 41 L69 58 Q69 73 50 73 Q31 73 31 58 Z"/>
    <path d="M45 31 Q47 14 50 12 Q53 14 55 31 Z"/>
    <path d="M37 50 L46 53 M54 53 L63 50" fill="none" stroke-width="3.2"/>
    <path d="M39 65 Q50 69 61 65" fill="none"/>
    <path d="M41.5 66 L43 58 L46.5 66 Z M58.5 66 L57 58 L53.5 66 Z" stroke-width="1.8"/>`],
  human: ['#7a3b5e', `
    <path d="M18 100 Q20 80 50 78 Q80 80 82 100 Z"/>
    <rect x="44" y="64" width="12" height="16"/>
    <circle cx="32.5" cy="54" r="4.5"/><circle cx="67.5" cy="54" r="4.5"/>
    <ellipse cx="50" cy="52" rx="17" ry="20"/>
    <path d="M32 48 Q30 30 44 28 Q48 21 56 27 Q70 28 68 48 Q63 40 56 42 Q50 35 44 41 Q38 39 32 48 Z"/>
    <g stroke="none" fill="BG"><circle cx="44" cy="54" r="2.3"/><circle cx="56" cy="54" r="2.3"/></g>
    <path d="M43.5 62 Q50 67.5 56.5 62" fill="none"/>`],

  // ----- classes -----
  wizard: ['#34387a', `
    <path d="M18 100 Q20 82 50 80 Q80 82 82 100 Z"/>
    <ellipse cx="50" cy="60" rx="15" ry="17"/>
    <path d="M35 64 Q33 94 50 99 Q67 94 65 64 Q58 73 50 71 Q42 73 35 64 Z"/>
    <path d="M24 47 Q38 26 50 7 Q53 3 57 7 Q60 26 76 47 Z"/>
    <ellipse cx="50" cy="47" rx="30" ry="6.5"/>
    <g stroke="none" fill="BG"><circle cx="44.5" cy="60" r="2.3"/><circle cx="55.5" cy="60" r="2.3"/>
      <path d="M50 22 l2.2 4.6 5 .6 -3.7 3.4 1 4.9 -4.5 -2.5 -4.5 2.5 1 -4.9 -3.7 -3.4 5 -.6 z"/></g>`],
  warrior: ['#3d4f6b', `
    <path d="M12 100 Q12 80 30 77 L70 77 Q88 80 88 100 Z"/>
    <circle cx="24" cy="84" r="9"/><circle cx="76" cy="84" r="9"/>
    <path d="M50 24 Q52 10 64 7 Q59 15 61 24 Z"/>
    <path d="M32 72 L32 42 Q32 22 50 22 Q68 22 68 42 L68 72 Q50 78 32 72 Z"/>
    <g stroke="none" fill="BG"><rect x="36" y="43" width="28" height="5.5" rx="2.75"/>
      <circle cx="42" cy="60" r="1.5"/><circle cx="42" cy="65" r="1.5"/><circle cx="58" cy="60" r="1.5"/><circle cx="58" cy="65" r="1.5"/></g>
    <path d="M50 49 L50 71" fill="none"/>`],
  cleric: ['#7a6420', `
    <path d="M18 100 Q20 82 50 80 Q80 82 82 100 Z"/>
    <ellipse cx="50" cy="60" rx="15" ry="17"/>
    <path d="M35 50 Q36 32 50 17 Q64 32 65 50 Z"/>
    <rect x="35" y="45" width="30" height="7" rx="2"/>
    <g stroke="none" fill="BG"><circle cx="50" cy="34" r="4"/><circle cx="50" cy="92" r="5"/></g>
    <path d="M50 26 L50 29 M50 39 L50 42 M42 34 L45 34 M55 34 L58 34" fill="none" stroke-width="2"/>
    <path d="M42.5 61 Q45 63.5 47.5 61 M52.5 61 Q55 63.5 57.5 61" fill="none"/>
    <path d="M46 68 Q50 70.5 54 68" fill="none"/>`],
  thief: ['#33333d', `
    <path d="M14 100 Q16 80 50 78 Q84 80 86 100 Z"/>
    <path d="M26 86 Q22 44 50 23 Q78 44 74 86 Z"/>
    <ellipse cx="50" cy="58" rx="16.5" ry="19.5" fill="BG" stroke="none"/>
    <ellipse cx="50" cy="61" rx="13" ry="16"/>
    <path d="M34.5 52 Q50 47.5 65.5 52 L65 60.5 Q50 57 35 60.5 Z" fill="BG" stroke="none"/>
    <g stroke="none"><ellipse cx="44" cy="55.5" rx="3" ry="2"/><ellipse cx="56" cy="55.5" rx="3" ry="2"/></g>
    <path d="M43.5 68 Q51 72 57 66.5" fill="none"/>`],
  bard: ['#2f7a6f', `
    <path d="M18 100 Q20 82 50 80 Q80 82 82 100 Z"/>
    <path d="M66 82 L84 54 L88.5 57 L71 85 Z"/>
    <ellipse cx="70" cy="90" rx="13" ry="11"/>
    <ellipse cx="50" cy="58" rx="15" ry="17"/>
    <path d="M60 37 Q71 19 85 15 Q77 26 65 40 Z"/>
    <path d="M62 37 Q73 24 82 18" fill="none" stroke-width="1.6"/>
    <path d="M33 47 Q35 31 50 31 Q65 31 67 47 Q50 42 33 47 Z"/>
    <ellipse cx="50" cy="46" rx="21" ry="5"/>
    <g stroke="none" fill="BG"><circle cx="44.5" cy="58" r="2.2"/><circle cx="55.5" cy="58" r="2.2"/>
      <ellipse cx="50" cy="66.5" rx="2.6" ry="3.2"/><circle cx="70" cy="90" r="3.2"/></g>`],

  // ----- monsters -----
  dragon: ['#9a3a1f', `
    <path d="M30 100 Q32 80 50 78 Q68 80 70 100 Z"/>
    <path d="M36 36 Q24 24 21 11 Q31 21 42 31 Z"/><path d="M64 36 Q76 24 79 11 Q69 21 58 31 Z"/>
    <path d="M31 50 L15 45 L31 61 Z"/><path d="M69 50 L85 45 L69 61 Z"/>
    <path d="M30 46 Q30 28 50 28 Q70 28 70 46 L66 64 Q62 80 50 80 Q38 80 34 64 Z"/>
    <path d="M44 29 L47 22 L50 29 L53 22 L56 29" stroke-width="2.2"/>
    <g stroke="none" fill="BG"><path d="M36 48 Q42 45.5 47 51 Q41 53.5 36 48 Z"/><path d="M64 48 Q58 45.5 53 51 Q59 53.5 64 48 Z"/>
      <ellipse cx="45" cy="72" rx="2.2" ry="1.6"/><ellipse cx="55" cy="72" rx="2.2" ry="1.6"/></g>
    <path d="M42 62 Q50 59 58 62" fill="none" stroke-width="2"/>`],
  skeleton: ['#4a3f5c', `
    <path d="M22 100 Q24 82 50 80 Q76 82 78 100 Z"/>
    <path d="M37 88 Q50 84 63 88 M35 95 Q50 91 65 95 M50 80 L50 100" fill="none"/>
    <path d="M30 48 Q30 26 50 26 Q70 26 70 48 Q70 60 63 64 L63 73 L37 73 L37 64 Q30 60 30 48 Z"/>
    <g stroke="none" fill="BG"><circle cx="41" cy="49" r="6"/><circle cx="59" cy="49" r="6"/><path d="M50 55 L46.5 61.5 L53.5 61.5 Z"/></g>
    <path d="M37 66 L63 66 M43 66 L43 73 M48 66 L48 73 M53 66 L53 73 M58 66 L58 73" fill="none" stroke-width="1.8"/>`],
  slime: ['#4f7a1f', `
    <path d="M16 94 Q14 72 29 60 Q35 34 50 32 Q65 34 71 60 Q86 72 84 94 Z"/>
    <path d="M30 92 Q30 100 34 100 M70 92 Q70 100 66 100" fill="none" stroke-width="2"/>
    <circle cx="62" cy="46" r="3" fill="none" stroke-width="2"/><circle cx="68" cy="54" r="1.8" fill="none" stroke-width="1.8"/>
    <g stroke="none"><circle cx="42" cy="64" r="5.5" fill="BG"/><circle cx="58" cy="64" r="5.5" fill="BG"/>
      <circle cx="43.3" cy="62.6" r="2"/><circle cx="59.3" cy="62.6" r="2"/></g>
    <path d="M43 76 Q50 81 57 76" fill="none"/>`],
  ghost: ['#3d3566', `
    <path d="M28 90 L28 48 Q28 24 50 24 Q72 24 72 48 L72 90 Q66 84 61 90 Q56 96 50 90 Q44 84 39 90 Q34 96 28 90 Z"/>
    <path d="M28 60 Q18 62 16 54 Q22 58 28 54 M72 60 Q82 62 84 54 Q78 58 72 54"/>
    <g stroke="none" fill="BG"><ellipse cx="42" cy="48" rx="3.6" ry="5"/><ellipse cx="58" cy="48" rx="3.6" ry="5"/>
      <ellipse cx="50" cy="63" rx="4.2" ry="5.6"/></g>`],
  troll: ['#666a3a', `
    <path d="M10 100 Q12 78 50 76 Q88 78 90 100 Z"/>
    <path d="M29 50 Q14 45 15 58 Q21 65 30 60 Z"/><path d="M71 50 Q86 45 85 58 Q79 65 70 60 Z"/>
    <path d="M28 52 Q28 30 50 30 Q72 30 72 52 Q72 76 50 78 Q28 76 28 52 Z"/>
    <path d="M38 33 L34 18 L44 28 L48 13 L54 28 L62 16 L62 33 Z"/>
    <path d="M36 44 L64 44" fill="none" stroke-width="3.2"/>
    <g stroke="none" fill="BG"><circle cx="42" cy="49" r="2.2"/><circle cx="58" cy="49" r="2.2"/></g>
    <ellipse cx="50" cy="57" rx="7" ry="6"/>
    <path d="M37 69 Q50 64 63 69" fill="none"/>
    <path d="M41.5 69 L43.5 62.5 L46 68.5 Z M54 68.5 L56.5 62.5 L58.5 69 Z" stroke-width="1.8"/>`],
  vampire: ['#5a1f33', `
    <path d="M12 100 L22 62 L40 80 L50 82 L60 80 L78 62 L88 100 Z"/>
    <path d="M36 54 L30 45 L37 60 Z"/><path d="M64 54 L70 45 L63 60 Z"/>
    <ellipse cx="50" cy="55" rx="15" ry="19"/>
    <path d="M34.5 52 Q33 32 50 30 Q67 32 65.5 52 Q60 41 50 47 Q40 41 34.5 52 Z"/>
    <path d="M42 56 L47.5 57.5 M52.5 57.5 L58 56" fill="none" stroke-width="2.8"/>
    <path d="M45 65 Q50 67 55 65" fill="none"/>
    <path d="M46.5 65.6 L47.6 70 L49 65.9 Z M53.5 65.6 L52.4 70 L51 65.9 Z" stroke-width="1.3"/>`],
  zombie: ['#3f5e4f', `
    <path d="M16 100 Q18 80 50 78 Q82 80 84 100 Z"/>
    <path d="M58 84 L62 92 L66 85" fill="none" stroke-width="2"/>
    <path d="M32 50 Q30 30 50 28 Q70 30 68 50 Q68 72 50 74 Q32 72 32 50 Z"/>
    <path d="M40 30 L37 21 M48 28 L48 18 M57 30 L61 22" fill="none" stroke="${CREAM}" stroke-width="2.6"/>
    <path d="M37 40 L63 37 M41 37 L42 42 M47 36.5 L48 41.5 M53 36 L54 41 M59 35.5 L60 40.5" fill="none" stroke-width="1.8"/>
    <g stroke="none" fill="BG"><circle cx="42" cy="50" r="4.6"/><circle cx="58" cy="51.5" r="2.6"/></g>
    <path d="M39 63 L43 60.5 L47 63.5 L51 60.5 L55 63.5 L59 61" fill="none" stroke-width="2.2"/>`],
  werewolf: ['#283c5e', `
    <path d="M14 100 Q16 80 30 78 L36 71 L42 79 L50 71 L58 79 L64 71 L70 78 Q84 80 86 100 Z"/>
    <path d="M33 41 L28 13 L47 30 Z"/><path d="M67 41 L72 13 L53 30 Z"/>
    <path d="M30 44 Q30 28 50 28 Q70 28 70 44 Q70 56 62 62 L58 76 Q50 82 42 76 L38 62 Q30 56 30 44 Z"/>
    <ellipse cx="50" cy="66" rx="9.5" ry="8.5"/>
    <g stroke="none" fill="BG"><path d="M33.5 33 L31 20 L40 29 Z"/><path d="M66.5 33 L69 20 L60 29 Z"/>
      <path d="M37 45 L46.5 48 L38 50 Z"/><path d="M63 45 L53.5 48 L62 50 Z"/><ellipse cx="50" cy="61.5" rx="4.2" ry="2.8"/></g>
    <path d="M50 64.5 L50 69 M44 70.5 Q50 74 56 70.5" fill="none" stroke-width="2"/>`],
  mimic: ['#8a4a1a', `
    <rect x="23" y="56" width="54" height="30" rx="3"/>
    <path d="M22 50 Q22 28 50 28 Q78 28 78 50 Z"/>
    <rect x="25" y="49" width="50" height="9" fill="BG" stroke="none"/>
    <path d="M26 49 L30 55 L34 49 L38 55 L42 49 L46 55 L50 49 L54 55 L58 49 L62 55 L66 49 L70 55 L74 49 Z" stroke-width="1.6"/>
    <path d="M26 58 L30 52.5 L34 58 L38 52.5 L42 58 L46 52.5 L50 58 L54 52.5 L58 58 L62 52.5 L66 58 L70 52.5 L74 58 Z" stroke-width="1.6"/>
    <path d="M23 70 L77 70 M36 30 L36 49 M64 30 L64 49" fill="none" stroke-width="2.2"/>
    <rect x="45.5" y="64" width="9" height="11" rx="1.5"/>
    <g stroke="none" fill="BG"><circle cx="43" cy="40" r="3.4"/><circle cx="57" cy="40" r="3.4"/><circle cx="50" cy="69.5" r="1.6"/></g>`],

  // ----- dungeon stuff -----
  door: ['#6b3f1f', `
    <path d="M30 94 L30 40 Q30 18 50 18 Q70 18 70 40 L70 94 Z"/>
    <path d="M40 21 L40 94 M50 18 L50 94 M60 21 L60 94" fill="none" stroke-width="2"/>
    <path d="M30 44 L70 44 M30 78 L70 78" fill="none" stroke-width="3.4"/>
    <circle cx="63" cy="61" r="3.6" fill="none" stroke-width="2.4"/>
    <path d="M18 94 L82 94" fill="none" stroke="${CREAM}" stroke-width="3"/>`],
  loot: ['#6b5410', `
    <path d="M24 86 Q11 70 24 51 Q30 43 36 41 L31 30 Q44 25 57 30 L52 41 Q58 43 64 51 Q77 70 64 86 Z"/>
    <path d="M32 41 Q44 45.5 56 41" fill="none" stroke-width="3"/>
    <path d="M44 57 L51.5 66 L44 75 L36.5 66 Z" fill="BG" stroke="none"/>
    <ellipse cx="70" cy="88" rx="10" ry="4"/><ellipse cx="70" cy="82.5" rx="10" ry="4"/><ellipse cx="70" cy="77" rx="10" ry="4"/>
    <ellipse cx="83" cy="88" rx="7" ry="3"/>`],
  potion: ['#4a2a7a', `
    <path d="M42 28 L42 44 Q26 52 26 68 Q26 88 50 88 Q74 88 74 68 Q74 52 58 44 L58 28 Z"/>
    <rect x="39.5" y="17" width="21" height="12" rx="3"/>
    <path d="M29 64 Q39.5 59.5 50 64 Q60.5 68.5 71 64" fill="none"/>
    <path d="M35.5 56 Q32.5 64 36.5 73" fill="none" stroke-width="2"/>
    <g stroke="none" fill="BG"><circle cx="45" cy="75" r="3"/><circle cx="57" cy="78.5" r="2.2"/><circle cx="53" cy="70.5" r="1.7"/></g>`],
  crown: ['#8a2340', `
    <path d="M24 70 L21 37 L36 53 L50 29 L64 53 L79 37 L76 70 Z"/>
    <rect x="23" y="66" width="54" height="13" rx="2"/>
    <circle cx="21" cy="34" r="4.5"/><circle cx="50" cy="26" r="5"/><circle cx="79" cy="34" r="4.5"/>
    <g stroke="none" fill="BG"><circle cx="36" cy="72.5" r="3"/><circle cx="50" cy="72.5" r="3.6"/><circle cx="64" cy="72.5" r="3"/></g>`],
};

fs.mkdirSync(OUT, { recursive: true });
for (const [id, [bg, body]] of Object.entries(AVATARS)) fs.writeFileSync(path.join(OUT, `${id}.svg`), token(bg, body));
console.log(`${Object.keys(AVATARS).length} avatars in ${OUT}`);
