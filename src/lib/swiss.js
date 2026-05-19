// Swiss tournament pairing and standings logic
// Follows standard MTG Comprehensive Rules tiebreaker order:
// 1. Points  2. OMW%  3. GWP%  4. OGWP%
// All percentages floored at 33% per WotC rules

export function generateSwissPairings(players, previousPairings) {
  const activePlayers = players.filter(p => !p.eliminated)

  // Build set of past matchups to avoid rematches
  const pastMatchups = new Set()
  for (const p of previousPairings) {
    if (p.player2_id) {
      pastMatchups.add(`${p.player1_id}|${p.player2_id}`)
      pastMatchups.add(`${p.player2_id}|${p.player1_id}`)
    }
  }

  // Who already had a bye
  const hadBye = new Set(
    previousPairings.filter(p => !p.player2_id).map(p => p.player1_id)
  )

  // Sort by points desc (rough ordering before we try to pair)
  const sorted = [...activePlayers].sort((a, b) => b.points - a.points)

  const pairings = []
  const paired = new Set()

  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i].id)) continue

    let foundPartner = false

    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j].id)) continue
      if (pastMatchups.has(`${sorted[i].id}|${sorted[j].id}`)) continue

      pairings.push({ player1Id: sorted[i].id, player2Id: sorted[j].id })
      paired.add(sorted[i].id)
      paired.add(sorted[j].id)
      foundPartner = true
      break
    }

    // Forced rematch fallback — all possible opponents already played
    if (!foundPartner) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (paired.has(sorted[j].id)) continue
        pairings.push({ player1Id: sorted[i].id, player2Id: sorted[j].id })
        paired.add(sorted[i].id)
        paired.add(sorted[j].id)
        break
      }
    }
  }

  // Handle odd player — give bye to unpaired player with lowest points who hasn't had a bye
  const unpaired = sorted.filter(p => !paired.has(p.id))
  if (unpaired.length === 1) {
    const noBye = unpaired.filter(p => !hadBye.has(p.id))
    const byeRecipient = noBye.length > 0 ? noBye[noBye.length - 1] : unpaired[unpaired.length - 1]
    pairings.push({ player1Id: byeRecipient.id, player2Id: null })
  }

  return pairings.map((p, idx) => ({ ...p, tableNumber: idx + 1 }))
}

function mwp(player) {
  const total = player.wins + player.losses + player.draws
  if (total === 0) return 0.33
  return Math.max(player.wins / total, 0.33)
}

export function calculateOMW(player, allPlayers, allPairings) {
  const opponentIds = allPairings
    .filter(p =>
      (p.player1_id === player.id || p.player2_id === player.id) && p.player2_id !== null
    )
    .map(p => (p.player1_id === player.id ? p.player2_id : p.player1_id))

  if (opponentIds.length === 0) return 0.33

  const vals = opponentIds.map(id => {
    const opp = allPlayers.find(p => p.id === id)
    return opp ? mwp(opp) : 0.33
  })

  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function calculateGWP(player) {
  const total = player.game_wins + player.game_losses
  if (total === 0) return 0.33
  return Math.max(player.game_wins / total, 0.33)
}

export function calculateOGWP(player, allPlayers, allPairings) {
  const opponentIds = allPairings
    .filter(p =>
      (p.player1_id === player.id || p.player2_id === player.id) && p.player2_id !== null
    )
    .map(p => (p.player1_id === player.id ? p.player2_id : p.player1_id))

  if (opponentIds.length === 0) return 0.33

  const vals = opponentIds.map(id => {
    const opp = allPlayers.find(p => p.id === id)
    return opp ? calculateGWP(opp) : 0.33
  })

  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function getStandings(players, allPairings) {
  return [...players]
    .map(p => ({
      ...p,
      omw: calculateOMW(p, players, allPairings),
      gwp: calculateGWP(p),
      ogwp: calculateOGWP(p, players, allPairings),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (Math.abs(b.omw - a.omw) > 0.0001) return b.omw - a.omw
      if (Math.abs(b.gwp - a.gwp) > 0.0001) return b.gwp - a.gwp
      return b.ogwp - a.ogwp
    })
}

// Apply a match result to player stats — returns updated player objects
export function applyResult(result, p1GameWins, p2GameWins, player1, player2) {
  const p1 = { ...player1 }
  const p2 = player2 ? { ...player2 } : null

  p1.game_wins += p1GameWins
  p1.game_losses += p2GameWins
  if (p2) {
    p2.game_wins += p2GameWins
    p2.game_losses += p1GameWins
  }

  if (result === 'player1') {
    p1.wins += 1
    p1.points += 3
    if (p2) { p2.losses += 1 }
  } else if (result === 'player2') {
    if (p2) { p2.wins += 1; p2.points += 3 }
    p1.losses += 1
  } else if (result === 'draw') {
    p1.draws += 1
    p1.points += 1
    if (p2) { p2.draws += 1; p2.points += 1 }
  }

  return { player1: p1, player2: p2 }
}

// Apply a bye — counts as win, 3 points, no game stats
export function applyBye(player) {
  return {
    ...player,
    wins: player.wins + 1,
    points: player.points + 3,
    byes: player.byes + 1,
  }
}
