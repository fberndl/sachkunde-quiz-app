// Avatar definitions: emoji-based for now, can be upgraded to SVG/PNG later.
// Each avatar has an id, display emoji, name, price in coins, and optional level gate.

export const STARTER_AVATARS = [
  { id: 'emoji_star', emoji: '\u2B50', name: 'Stern' },
  { id: 'emoji_fire', emoji: '\uD83D\uDD25', name: 'Feuer' },
  { id: 'emoji_brain', emoji: '\uD83E\uDDE0', name: 'Gehirn' },
  { id: 'emoji_rocket', emoji: '\uD83D\uDE80', name: 'Rakete' },
  { id: 'emoji_crown', emoji: '\uD83D\uDC51', name: 'Krone' },
];

export const UNLOCKABLE_AVATARS = [
  { id: 'fiaker',       emoji: '\uD83D\uDC0E', name: 'Fiaker-Kutscherin',          price: 15, levelGate: 0 },
  { id: 'heuriger',     emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', name: 'Heuriger-Koch',              price: 15, levelGate: 0 },
  { id: 'prater',       emoji: '\uD83C\uDFA1', name: 'Prater-Riesenrad-Pilot',     price: 20, levelGate: 3 },
  { id: 'schoenbrunn',  emoji: '\uD83E\uDD81', name: 'Sch\u00F6nbrunn-L\u00F6we',  price: 25, levelGate: 5 },
  { id: 'ubahn',        emoji: '\uD83D\uDE87', name: 'U-Bahn-Kapit\u00E4nin',      price: 25, levelGate: 5 },
  { id: 'donau',        emoji: '\uD83E\uDDDC\u200D\u2640\uFE0F', name: 'Donau-Nixe',                 price: 30, levelGate: 7 },
  { id: 'ringstrasse',  emoji: '\uD83C\uDFDB\uFE0F', name: 'Ringstra\u00DFen-Architekt',  price: 30, levelGate: 7 },
  { id: 'stephansdom',  emoji: '\u26EA', name: 'Stephansdom-W\u00E4chter',   price: 40, levelGate: 10 },
  { id: 'saengerknabe', emoji: '\uD83C\uDFA4', name: 'Wiener S\u00E4ngerknabe',    price: 40, levelGate: 10 },
  { id: 'augarten',     emoji: '\uD83C\uDFA8', name: 'Augarten-Meisterin',         price: 50, levelGate: 12 },
  { id: 'rathausmann',  emoji: '\uD83C\uDFF0', name: 'Rathausmann',                price: 35, levelGate: 8 },
  { id: 'naschmarkt',   emoji: '\uD83C\uDF4E', name: 'Naschmarkt-H\u00E4ndlerin',  price: 25, levelGate: 6 },
  { id: 'zentralfried', emoji: '\uD83E\uDDDB', name: 'Zentralfriedhof-Geist',      price: 45, levelGate: 11 },
  { id: 'wienfluss',    emoji: '\uD83D\uDC1F', name: 'Wienfluss-Fisch',            price: 20, levelGate: 4 },
  { id: 'klimt',        emoji: '\uD83D\uDDBC\uFE0F', name: 'Klimt-K\u00FCnstler',         price: 50, levelGate: 14 },
];

export const ALL_AVATARS = [...STARTER_AVATARS, ...UNLOCKABLE_AVATARS];

export function getAvatarById(id) {
  return ALL_AVATARS.find(a => a.id === id) || STARTER_AVATARS[0];
}
