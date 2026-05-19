'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GAME_PRESETS, getSwissRounds } from '@/lib/gamePresets'

const TOURNAMENT_TYPES = [
  {
    id: 'swiss',
    label: 'Swiss',
    description: 'Everyone plays all rounds. Ranked by wins and tiebreakers. Best for fair rankings where every player gets equal games.',
  },
  {
    id: 'single_elim',
    label: 'Single Elimination',
    description: 'Lose once and you\'re out. Fast knockout bracket. Great for deciding a champion quickly.',
  },
  {
    id: 'double_elim',
    label: 'Double Elimination',
    description: 'Two lives — lose once and move to the losers bracket, lose again and you\'re out. More forgiving, finds the true best player.',
  },
]

export default function CreateTournament() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [game, setGame] = useState('')
  const [format, setFormat] = useState('bo1')
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [customTimer, setCustomTimer] = useState(false)
  const [playerInput, setPlayerInput] = useState('')
  const [players, setPlayers] = useState([])

  const selectedGame = GAME_PRESETS.find(g => g.name === game)

  function handleGameChange(gameName) {
    const preset = GAME_PRESETS.find(g => g.name === gameName)
    setGame(gameName)
    setCustomTimer(gameName === 'Custom')
    if (preset && !customTimer) {
      setFormat('bo1')
      setTimerMinutes(preset.bo1 || 30)
    }
  }

  function handleFormatChange(f) {
    setFormat(f)
    if (selectedGame && !customTimer) {
      const mins = f === 'bo3' ? selectedGame.bo3 : selectedGame.bo1
      setTimerMinutes(mins || 30)
    }
  }

  function addPlayer() {
    const trimmed = playerInput.trim()
    if (!trimmed) return
    if (players.includes(trimmed)) {
      setError('Player name already added')
      return
    }
    setPlayers(prev => [...prev, trimmed])
    setPlayerInput('')
    setError('')
  }

  function removePlayer(i) {
    setPlayers(prev => prev.filter((_, idx) => idx !== i))
  }

  function handlePlayerKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPlayer()
    }
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, game, format, timerMinutes, playerNames: players }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      // Store as TD in localStorage
      const tdRooms = JSON.parse(localStorage.getItem('tcg_td_rooms') || '[]')
      tdRooms.push(data.code)
      localStorage.setItem('tcg_td_rooms', JSON.stringify(tdRooms))
      router.push(`/room/${data.code}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const step1Valid = name.trim() && type
  const step2Valid = game && timerMinutes > 0
  const step3Valid = players.length >= 2

  const swissRounds = type === 'swiss' ? getSwissRounds(players.length) : null

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => step === 1 ? router.push('/') : setStep(s => s - 1)}
            className="text-slate-400 hover:text-slate-200 text-sm mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-100">Create Tournament</h1>
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-violet-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Name + Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Name</label>
              <input
                type="text"
                placeholder="e.g. Friday Night Gundam"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Format</label>
              <div className="space-y-3">
                {TOURNAMENT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      type === t.id
                        ? 'border-violet-500 bg-violet-950/40'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">{t.label}</div>
                    <div className="text-sm text-slate-400 mt-1">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Game + Timer */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Game</label>
              <select
                value={game}
                onChange={e => handleGameChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">Select a game...</option>
                {GAME_PRESETS.map(g => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {selectedGame && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFormatChange('bo1')}
                    className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
                      format === 'bo1' ? 'border-violet-500 bg-violet-950/40 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Best of 1
                  </button>
                  {(selectedGame.supportsBO3) && (
                    <button
                      onClick={() => handleFormatChange('bo3')}
                      className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
                        format === 'bo3' ? 'border-violet-500 bg-violet-950/40 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      Best of 3
                    </button>
                  )}
                  <button
                    onClick={() => { setFormat('custom'); setCustomTimer(true) }}
                    className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
                      format === 'custom' ? 'border-violet-500 bg-violet-950/40 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Round Timer (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={timerMinutes}
                onChange={e => setTimerMinutes(Number(e.target.value))}
                disabled={!customTimer && !!selectedGame && format !== 'custom'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-violet-500 disabled:opacity-50"
              />
              {!customTimer && selectedGame && format !== 'custom' && (
                <p className="text-xs text-slate-500 mt-1">Auto-set from game preset. Select Custom to override.</p>
              )}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 3: Players */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Add Players ({players.length} added)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Player name"
                  value={playerInput}
                  onChange={e => { setPlayerInput(e.target.value); setError('') }}
                  onKeyDown={handlePlayerKeyDown}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={addPlayer}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 rounded-xl transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="space-y-2">
                {players.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2">
                    <span className="text-slate-200">
                      <span className="text-slate-500 mr-2 text-sm">#{i + 1}</span>
                      {p}
                    </span>
                    <button onClick={() => removePlayer(i)} className="text-slate-500 hover:text-red-400 text-lg">×</button>
                  </div>
                ))}
              </div>
            )}

            {players.length < 2 && (
              <p className="text-slate-500 text-sm text-center">Add at least 2 players to continue</p>
            )}

            {type === 'swiss' && players.length >= 2 && (
              <div className="bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-400">
                {players.length} players → <span className="text-violet-400 font-semibold">{swissRounds} Swiss rounds</span>
              </div>
            )}

            <button
              onClick={() => setStep(4)}
              disabled={!step3Valid}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Review
            </button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl divide-y divide-slate-700">
              <Row label="Name" value={name} />
              <Row label="Format" value={TOURNAMENT_TYPES.find(t => t.id === type)?.label} />
              <Row label="Game" value={game} />
              <Row label="Round Format" value={format === 'bo1' ? 'Best of 1' : format === 'bo3' ? 'Best of 3' : 'Custom'} />
              <Row label="Timer" value={`${timerMinutes} minutes`} />
              <Row label="Players" value={`${players.length} players`} />
              {type === 'swiss' && <Row label="Rounds" value={`${swissRounds} rounds`} />}
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Players</p>
              <div className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <span key={i} className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded-md">{p}</span>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Start Tournament'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-100 text-sm font-medium">{value}</span>
    </div>
  )
}
