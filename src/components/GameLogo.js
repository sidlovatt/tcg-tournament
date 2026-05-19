const LOGO_FILES = {
  'Gundam TCG':           'gundam-tcg.png',
  'Magic: The Gathering': 'magic-the-gathering.png',
  'Pokemon TCG':          'pokemon-tcg.png',
  'Yu-Gi-Oh!':            'yu-gi-oh.png',
  'One Piece TCG':        'one-piece-tcg.png',
  'Flesh and Blood':      'flesh-and-blood.png',
  'Dragon Ball Super':    'dragon-ball-super.png',
  'Digimon TCG':          'digimon-tcg.png',
  'Lorcana':              'lorcana.png',
  'Riftbound':            'riftbound.png',
}

export default function GameLogo({ game, className = '' }) {
  const file = LOGO_FILES[game]
  if (!file) return null
  return (
    <img
      src={`/logos/${file}`}
      alt={game}
      className={`object-contain ${className}`}
      onError={e => { e.currentTarget.style.display = 'none' }}
    />
  )
}
