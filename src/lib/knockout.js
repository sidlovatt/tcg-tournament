// Knockout bracket logic — single and double elimination

// Generate round 1 pairings — straight pairs, no byes for even counts
export function generateSingleElimPairings(players) {
  const pairings = []
  for (let i = 0; i < players.length; i += 2) {
    const p1 = players[i]
    const p2 = players[i + 1] || null
    pairings.push({
      player1Id: p1.id,
      player2Id: p2?.id || null,
      tableNumber: i / 2 + 1,
      autoAdvance: !p2,
    })
  }
  return pairings
}

// Advance single elim round.
// If winners count is odd, randomly revive one loser (lucky loser).
export function nextSingleElimRound(completedPairings, allPlayers) {
  const winners = []
  const losers = []

  for (const p of completedPairings) {
    if (!p.player2_id) {
      winners.push(allPlayers.find(pl => pl.id === p.player1_id))
    } else if (p.result === 'player1') {
      winners.push(allPlayers.find(pl => pl.id === p.player1_id))
      losers.push(allPlayers.find(pl => pl.id === p.player2_id))
    } else if (p.result === 'player2') {
      winners.push(allPlayers.find(pl => pl.id === p.player2_id))
      losers.push(allPlayers.find(pl => pl.id === p.player1_id))
    }
  }

  const advancing = winners.filter(Boolean)

  if (advancing.length === 1) {
    return { done: true, winner: advancing[0], pairings: [], luckyLoser: null }
  }

  let participants = [...advancing]
  let luckyLoser = null

  if (participants.length % 2 !== 0) {
    const validLosers = losers.filter(Boolean)
    if (validLosers.length > 0) {
      luckyLoser = validLosers[Math.floor(Math.random() * validLosers.length)]
      participants = [...participants, luckyLoser]
    }
  }

  const pairings = []
  for (let i = 0; i < participants.length; i += 2) {
    pairings.push({
      player1Id: participants[i].id,
      player2Id: participants[i + 1]?.id || null,
      tableNumber: i / 2 + 1,
      autoAdvance: !participants[i + 1],
    })
  }

  return { done: false, winner: null, pairings, luckyLoser }
}

// Double elim — round 1 same as single elim winners bracket
export function generateDoubleElimPairings(players) {
  return { winnersPairings: generateSingleElimPairings(players), losersPairings: [] }
}

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

  const losersAdvance = []
  const losersElim = []

  for (const p of completedLosers) {
    if (!p.player2_id || p.result === 'player1') {
      losersAdvance.push(getPlayer(p.player1_id))
    } else {
      losersAdvance.push(getPlayer(p.player2_id))
      losersElim.push(getPlayer(p.player1_id))
    }
  }

  const allLosersNext = [...toLosersBracket, ...losersAdvance].filter(Boolean)
  const winnersFiltered = winnersAdvance.filter(Boolean)

  const newWinnersPairings = []
  for (let i = 0; i < winnersFiltered.length; i += 2) {
    const a = winnersFiltered[i]
    const b = winnersFiltered[i + 1]
    newWinnersPairings.push({ player1Id: a.id, player2Id: b?.id || null, tableNumber: i / 2 + 1 })
  }

  const newLosersPairings = []
  for (let i = 0; i < allLosersNext.length; i += 2) {
    const a = allLosersNext[i]
    const b = allLosersNext[i + 1]
    if (a) newLosersPairings.push({ player1Id: a.id, player2Id: b?.id || null, tableNumber: i / 2 + 1 })
  }

  return { newWinnersPairings, newLosersPairings, eliminated: losersElim }
}
