// Knockout bracket logic — single and double elimination

function nextPowerOf2(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Standard bracket seed order: 1v(n), 2v(n-1)...
function seedOrder(size) {
  if (size === 2) return [1, 2]
  const half = seedOrder(size / 2)
  return half.flatMap(s => [s, size + 1 - s])
}

// Generate round 1 pairings from seeded players list
export function generateSingleElimPairings(players) {
  const size = nextPowerOf2(players.length)
  const seeds = seedOrder(size)
  const pairings = []

  for (let i = 0; i < seeds.length; i += 2) {
    const p1 = players[seeds[i] - 1] || null
    const p2 = players[seeds[i + 1] - 1] || null

    // Auto-advance if one slot is empty (bye)
    if (p1 && !p2) {
      pairings.push({ player1Id: p1.id, player2Id: null, tableNumber: i / 2 + 1, autoAdvance: true })
    } else if (!p1 && p2) {
      pairings.push({ player1Id: p2.id, player2Id: null, tableNumber: i / 2 + 1, autoAdvance: true })
    } else if (p1 && p2) {
      pairings.push({ player1Id: p1.id, player2Id: p2.id, tableNumber: i / 2 + 1, autoAdvance: false })
    }
  }

  return pairings
}

// Advance winners to next round in single elim
export function nextSingleElimRound(completedPairings, allPlayers) {
  const winners = completedPairings.map(p => {
    if (!p.player2_id) return allPlayers.find(pl => pl.id === p.player1_id) // bye auto-advance
    if (p.result === 'player1') return allPlayers.find(pl => pl.id === p.player1_id)
    if (p.result === 'player2') return allPlayers.find(pl => pl.id === p.player2_id)
    return null
  }).filter(Boolean)

  if (winners.length === 1) return { done: true, winner: winners[0], pairings: [] }

  const pairings = []
  for (let i = 0; i < winners.length; i += 2) {
    pairings.push({
      player1Id: winners[i].id,
      player2Id: winners[i + 1]?.id || null,
      tableNumber: i / 2 + 1,
      autoAdvance: !winners[i + 1],
    })
  }

  return { done: false, winner: null, pairings }
}

// Generate round 1 for double elimination
// Returns { winnersPairings, losersPairings: [] }
export function generateDoubleElimPairings(players) {
  const pairings = generateSingleElimPairings(players)
  return { winnersPairings: pairings, losersPairings: [] }
}

// Advance double elim after a round
// completedWinners: pairings from winners bracket
// completedLosers: pairings from losers bracket
export function nextDoubleElimRound(completedWinners, completedLosers, allPlayers) {
  const getPlayer = id => allPlayers.find(p => p.id === id)

  const winnersAdvance = []
  const toLosersBracket = []

  for (const p of completedWinners) {
    if (!p.player2_id || p.result === 'player1') {
      winnersAdvance.push(getPlayer(p.player1_id))
    } else {
      winnersAdvance.push(getPlayer(p.player2_id))
      toLosersBracket.push(getPlayer(p.player1_id))
    }
    if (p.player2_id && p.result === 'player2') {
      toLosersBracket.push(getPlayer(p.player1_id))
    }
  }

  const losersElim = []
  const losersAdvance = []

  for (const p of completedLosers) {
    if (!p.player2_id || p.result === 'player1') {
      losersAdvance.push(getPlayer(p.player1_id))
    } else {
      losersAdvance.push(getPlayer(p.player2_id))
      losersElim.push(getPlayer(p.player1_id))
    }
  }

  const allLosersNext = [...toLosersBracket, ...losersAdvance].filter(Boolean)

  const newWinnersPairings = []
  for (let i = 0; i < winnersAdvance.filter(Boolean).length; i += 2) {
    const a = winnersAdvance.filter(Boolean)[i]
    const b = winnersAdvance.filter(Boolean)[i + 1]
    if (a && b) newWinnersPairings.push({ player1Id: a.id, player2Id: b.id, tableNumber: i / 2 + 1 })
    else if (a) newWinnersPairings.push({ player1Id: a.id, player2Id: null, tableNumber: i / 2 + 1 })
  }

  const newLosersPairings = []
  for (let i = 0; i < allLosersNext.length; i += 2) {
    const a = allLosersNext[i]
    const b = allLosersNext[i + 1]
    if (a && b) newLosersPairings.push({ player1Id: a.id, player2Id: b.id, tableNumber: i / 2 + 1 })
    else if (a) newLosersPairings.push({ player1Id: a.id, player2Id: null, tableNumber: i / 2 + 1 })
  }

  // Grand final: winners bracket winner vs losers bracket winner
  const grandFinal =
    newWinnersPairings.length === 0 && newLosersPairings.length === 0
      ? null
      : null // set by caller when both brackets produce single player

  return { newWinnersPairings, newLosersPairings, eliminated: losersElim, grandFinal }
}
