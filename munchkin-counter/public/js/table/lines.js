// Announcer lines, per situation. Each function gets a context and returns every way to say it:
//   who    player name(s), already HTML-formatted
//   n      how many players are in the situation (for singular/plural)
//   level, gap   numbers where relevant
// Keep them short: two lines of the top bar on an iPad is about 90 characters.
// A line shows for a minute and none repeats until its whole list has been used.

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
    `💀 ${who} is dead. Everyone take something nice from the corpse.`,
    `💀 ${who} died. Same level, empty pockets.`,
    `💀 RIP ${who}'s gear. The level survived; the loot didn't.`,
  ],

  start: () => [
    `Fresh characters, empty backpacks. Go find something to hit.`,
    `Level 1 all round. Enjoy it — this is the only time everyone at this table is friends.`,
    `No one's ahead, so no one's a target. That won't last.`,
  ],

  // the rest are about one player alone at the top

  nine: ({ who }) => [
    `⚠️ Level 9: ${who}. If you've been saving a curse, now is the time.`,
    `⚠️ ${who} is at level 9. A good moment to remember old grudges.`,
    `⚠️ ${who} needs just one more monster. Make it a very big one.`,
    `⚠️ ${who} is one kill from glory. Nobody blink.`,
  ],

  eight: ({ who }) => [
    `${who} hits level 8. The friendly part of the game is over.`,
    `${who} is at level 8. Anyone holding a curse should be thinking about it.`,
    `${who} at level 8. Every curse at this table just found a home.`,
    `Level 8: ${who}. Stop helping. Seriously.`,
    `${who} is level 8. Remember those monster enhancers you were saving?`,
  ],

  runaway: ({ who, gap }) => [
    `${who} is ${gap} levels ahead. The rest of you have a common enemy now.`,
    `${who} leads by ${gap}. Temporary alliances are now in season.`,
    `${who} is pulling away by ${gap}. Nobody's helping them anymore, right?`,
    `${who} is ${gap} levels ahead. Unite. Briefly.`,
    `A ${gap}-level lead for ${who}. The table has a new favourite target.`,
  ],

  // one player with far more gear than everyone else
  hoard: ({ who }) => [
    `That much gear on ${who}? Either very lucky or very sneaky.`,
    `Count ${who}'s items again. Slowly.`,
    `${who}'s pockets are suspiciously full.`,
    `${who} just keeps finding things. Funny, that.`,
  ],

  status: ({ who, level }) => [
    `Current leader: ${who}. Current target: also ${who}.`,
    `${who} leads with level ${level}. Nobody else is happy about it.`,
  ],

  // table talk, all game long
  flavor: () => [
    `Helping in a fight is a business arrangement, not a favour.`,
    `Nothing in the rules says you have to be nice.`,
    `If the monster is too big, that's what the other players are for.`,
    `Every bribe is a promise you might keep.`,
    `Somebody at this table is holding a curse with your name on it.`,
    `Loot the room, then look innocent.`,
    `There's no such thing as a fair fight in the dungeon. Only profitable ones.`,
    `Wandering monsters don't wander on their own. Someone sends them.`,
    `When in doubt about a rule, argue louder.`,
    `A good backstab is just teamwork with better timing.`,
    `Every door hides a monster, a curse, or a very short friendship.`,
    `Hand too full? The lowest level at the table thanks you in advance.`,
    `If someone offers to help for nothing, count your treasures afterwards.`,
    `The monster is not the only thing in the room that wants you dead.`,
    `Bad Stuff happens. Mostly to people who didn't bring friends.`,
    `Every alliance comes with an expiry date. Usually your next turn.`,
    `Ask nicely for help. Then ask again with treasure.`,
    `Rule of the dungeon: whoever owns the game is right.`,
    `Your best friend is the one who hasn't cursed you yet.`,
    `A Wandering Monster is just a gift you didn't ask for.`,
    `Running away is a perfectly respectable career choice.`,
    `If you're not sure whether to play that curse, you're sure.`,
    `Help offered. Terms and conditions apply.`,
    `Loot is shared fairly: everyone gets what they can grab.`,
    `Count your bonuses. Then count them again, slower.`,
    `Kick the door with confidence. Close it with regret.`,
    `The die is not cursed. Probably.`,
    `Your rival is one bad door away from being your best friend again.`,
    `Help now, betray later. It's called planning ahead.`,
    `Time flies when you're stabbing friends in the back.`,
    `Nobody at this table is your friend. Some of them are just polite about it.`,
    `Gratitude in the dungeon lasts about one turn.`,
    `Sharing is caring. Caring is optional.`,
    `The dungeon is full of monsters. Most of them are sitting at this table.`,
    `Never let a good monster go to waste. Give it to a friend.`,
    `A deal is a deal. Until it isn't.`,
    `The fastest way to make friends: be in last place.`,
    `The fastest way to lose friends: be in first place.`,
    `Revenge is a valid strategy. So is pettiness.`,
    `Behind every hero is someone trying to steal their stuff.`,
    `Never underestimate a player who's been quiet for three turns.`,
    `Every door is a gamble. So is every friendship.`,
    `The monster was fair. The player who boosted it wasn't.`,
    `Keep your friends close and your curses closer.`,
    `Alliances are temporary. Grudges are forever.`,
    `Every hero needs a sidekick. Preferably one who doesn't want the treasure.`,
    `The treasure is in the room. The danger is around the table.`,
    `Every monster has a weakness. Every player has a price.`,
    `Gold can't buy happiness. It can buy a level, though.`,
    `Somebody always remembers the rules better when it helps them.`,
    `The monster isn't the problem. The person beside you is.`,
    `Every fight has three sides: yours, the monster's, and whoever profits.`,
    `Betrayal tastes better with loot.`,
    `The table is quiet. Someone is counting their bonuses.`,
    `If everyone hates you, you're probably winning.`,
    `Last place is just first place with more friends.`,
    `That monster had a lot of guts. Now they're on the floor.`,
    `Elves help so much. Truly elf-less.`,
    `The Wizard's spells are charming. Literally.`,
    `The Thief stole the show. And your boots.`,
    `Boots? Kicking. Doors? Kicked. Friendships? Also kicked.`,
    `Rest in pieces, monster.`,
    `Bad Stuff? More like Sad Stuff.`,
    `The Wizard cast a spell. The table cast suspicion.`,
    `The level 1 player has a lot of potential. And nothing else.`,
    `Somebody here has a brilliant plan. It involves your treasure.`,
    `The player in last place has a bright future. Somewhere far from here.`,
  ],
};
