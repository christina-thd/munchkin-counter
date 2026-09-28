// Announcer lines, per situation. Each function gets a context and returns every way to say it:
//   who    player name(s), already HTML-formatted
//   n      how many players are in the situation (for singular/plural)
//   level, gap, gear, toWin   numbers where relevant
// Keep them short: two lines of the top bar on an iPad is about 90 characters.

const s = (n, one, many) => (n > 1 ? many : one);

export const LINES = {
  win: ({ who, n }) => [
    `👑 ${who} reached level 10 and ${s(n, 'wins', 'win')}. Everyone else was clearly unlucky.`,
    `👑 ${who} ${s(n, 'wins', 'win')} at level 10. Recount the cards if it makes you feel better.`,
    `👑 Level 10: ${who}. Game over. Shuffle up and start planning revenge.`,
    `👑 Victory for ${who}. Somebody helped at some point. Remember who.`,
    `👑 ${who} ${s(n, 'wins', 'win')}. New champion, new grudges.`,
  ],

  death: ({ who }) => [
    `💀 ${who} died. Level stays, gear goes. Loot the body.`,
    `💀 ${who} is dead. Everyone take something nice from the corpse.`,
    `💀 ${who} has died, keeping their level and absolutely nothing else.`,
    `💀 ${who} died. Same level, empty pockets.`,
    `💀 RIP ${who}'s gear. The level survived; the loot didn't.`,
    `💀 ${who} is dead. Highest level picks first from the body.`,
    `💀 ${who} died. It's only permanent for the equipment.`,
  ],

  start: () => [
    `Everyone's level 1. Somebody kick open a door.`,
    `All level 1. The dungeon is quiet. Too quiet.`,
    `Level 1 across the board. Nobody has anything worth stealing yet.`,
    `Fresh characters, empty backpacks. Go find something to hit.`,
    `Level 1 all round. Enjoy it — this is the only time everyone at this table is friends.`,
    `No one's ahead, so no one's a target. That won't last.`,
  ],

  nine: ({ who, n }) => [
    `⚠️ ${who} ${s(n, 'is', 'are')} at level 9. The next monster they kill ends the game.`,
    `⚠️ ${who} ${s(n, 'is', 'are')} at level 9. Level 10 can't be bought, only killed for.`,
    `⚠️ Level 9: ${who}. If you've been saving a curse, now is the time.`,
    `⚠️ ${who} ${s(n, 'needs', 'need')} one more kill. Every monster enhancer just became urgent.`,
    `⚠️ ${who} ${s(n, 'is', 'are')} one fight away from winning. Nobody help. Not for any price.`,
    `⚠️ ${who} at level 9. Suddenly everyone cares about their next fight.`,
    `⚠️ ${who} ${s(n, 'is', 'are')} at level 9. A good moment to remember old grudges.`,
  ],

  eight: ({ who, n }) => [
    `${who} ${s(n, 'is', 'are')} at level 8. Time to start making their fights harder.`,
    `${who} ${s(n, 'hits', 'hit')} level 8. The friendly part of the game is over.`,
    `Level 8 for ${who}. Two more to go — make both of them expensive.`,
    `${who} ${s(n, 'is', 'are')} at level 8. Anyone holding a curse should be thinking about it.`,
    `${who} ${s(n, 'is', 'are')} at level 8, and the rest of the table has noticed.`,
  ],

  tie: ({ who, level }) => [
    `${who} are tied at level ${level}. Only one of them gets to win.`,
    `Dead heat at level ${level}: ${who}. Expect selective helping.`,
    `${who} share the lead at level ${level}. That arrangement won't last.`,
    `Tied at level ${level}: ${who}. Watch who helps whom.`,
    `${who} are neck and neck at level ${level}. Someone's getting cursed.`,
  ],

  runaway: ({ who, gap }) => [
    `${who} is ${gap} levels ahead. The rest of you have a common enemy now.`,
    `${who} leads by ${gap}. Temporary alliances are now in season.`,
    `${who} is ${gap} levels clear. Every monster they fight should be a little bigger.`,
    `${who} is pulling away by ${gap}. Nobody's helping them anymore, right?`,
    `${gap} levels ahead: ${who}. That isn't luck, that's a target.`,
    `${who} is out in front by ${gap}. Time to aim the curses.`,
  ],

  stuck: ({ who, n }) => [
    `${who} ${s(n, 'is', 'are')} still level 1. You can't lose a level from there, at least.`,
    `${who} ${s(n, 'is', 'are')} still level 1. First in line for Charity, though.`,
    `${who}: level 1, and the dungeon isn't taking them seriously.`,
    `${who} ${s(n, 'is', 'are')} still level 1. The Bad Stuff can't get much worse.`,
    `${who} ${s(n, 'has', 'have')} yet to leave level 1. Maybe try a smaller door.`,
    `Still level 1: ${who}. Someone help. For a fee.`,
    `${who} ${s(n, 'remains', 'remain')} level 1. Bold strategy.`,
  ],

  behind: ({ who, n, gap }) => [
    `${who} ${s(n, 'is', 'are')} ${gap}+ levels behind. Catching up will take a big monster and a small miracle.`,
    `${who} ${s(n, 'trails', 'trail')} by ${gap} or more. Charity is on its way.`,
    `${who} ${s(n, 'is', 'are')} well behind. Perfect position to help in fights — at a price.`,
    `${who}, ${gap}+ levels back. Nobody sees them as a threat. Use that.`,
    `${who} ${s(n, 'is', 'are')} falling behind. Offer help, take the best treasure.`,
  ],

  loaded: ({ who, n, gear }) => (n === 1 ? [
    `${who} has +${gear} in gear. That's not a character, that's a walking shop.`,
    `${who} carries +${gear} of gear. Those items would look great on someone else.`,
    `${who} is at +${gear} gear. One good curse would even things out.`,
    `+${gear} gear on ${who}. Dying would be very expensive for them.`,
    `${who} has +${gear} in gear. Find them a bigger monster.`,
  ] : [
    `${who} are loaded with gear. Their deaths would be very profitable.`,
    `${who} are armed to the teeth. The monsters should be nervous. So should everyone else.`,
    `${who} are carrying enough gear to open a shop.`,
  ]),

  cursed: ({ who, n, gear }) => [
    `${who} ${s(n, 'is', 'are')} cursed. Negative gear is still gear, technically.`,
    `${who} ${s(n, 'is', 'are')} carrying a curse. It seemed like a good idea when someone else played it.`,
    `${who} ${s(n, 'has', 'have')} negative gear. Even the monsters feel sorry.`,
    `Cursed: ${who}. Someone at this table is quietly pleased.`,
    n === 1 ? `${who} is down to ${gear}. That's a curse, not a strategy.` : `${who} are all cursed. Somebody has been busy.`,
    `${who} ${s(n, 'is', 'are')} cursed. The monsters just got a little easier. For them, not for you.`,
  ],

  flavor: () => [
    `Can't beat the monster? Ask for help. Then negotiate the loot.`,
    `Helping in a fight is a business arrangement, not a favour.`,
    `Nothing in the rules says you have to be nice.`,
    `Kicked open a door and found nothing? You can always go Looking for Trouble.`,
    `Running away takes a 5 or 6. Start praying now.`,
    `Selling items for levels is legal. Winning that way isn't.`,
    `If the monster is too big, that's what the other players are for.`,
    `Every bribe is a promise you might keep.`,
    `Somebody at this table is holding a curse with your name on it.`,
    `The best time to play a monster enhancer is during someone else's fight.`,
    `Too many cards at the end of your turn? Charity goes to the lowest level.`,
    `Loot the room, then look innocent.`,
    `There's no such thing as a fair fight in the dungeon. Only profitable ones.`,
    `Wandering monsters don't wander on their own. Someone sends them.`,
    `Only one Big item at a time. Unless you're a Dwarf.`,
    `When in doubt about a rule, argue louder.`,
  ],

  status: ({ who, n, level, toWin }) => [
    `Leading: ${who} · level ${level} · ${toWin} to win`,
    `${who} ${s(n, 'leads', 'lead')} at level ${level}. ${toWin} to go.`,
    `Top of the table: ${who}, level ${level}.`,
  ],
};
