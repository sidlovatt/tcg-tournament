export const GAME_PRESETS = [
  { name: 'Gundam TCG',           bo1: 30,  bo3: 60,  supportsBO3: true  },
  { name: 'Magic: The Gathering', bo1: 50,  bo3: 50,  supportsBO3: true  },
  { name: 'Pokemon TCG',          bo1: 50,  bo3: null, supportsBO3: false },
  { name: 'Yu-Gi-Oh!',            bo1: 40,  bo3: null, supportsBO3: false },
  { name: 'One Piece TCG',        bo1: 50,  bo3: 60,  supportsBO3: true  },
  { name: 'Flesh and Blood',      bo1: 50,  bo3: null, supportsBO3: false },
  { name: 'Dragon Ball Super',    bo1: 40,  bo3: 60,  supportsBO3: true  },
  { name: 'Digimon TCG',          bo1: 30,  bo3: null, supportsBO3: false },
  { name: 'Lorcana',              bo1: 50,  bo3: null, supportsBO3: false },
  { name: 'Riftbound',            bo1: 30,  bo3: null, supportsBO3: false },
  { name: 'Custom',               bo1: null, bo3: null, supportsBO3: true },
]

// Bandai TCG official Swiss round counts (Dragon Ball Super / One Piece / Gundam)
export function getSwissRounds(playerCount) {
  if (playerCount <= 4)  return 2
  if (playerCount <= 8)  return 3
  if (playerCount <= 16) return 4
  if (playerCount <= 32) return 5
  if (playerCount <= 64) return 6
  return 7
}

export function getGamePreset(name) {
  return GAME_PRESETS.find(g => g.name === name) || null
}
