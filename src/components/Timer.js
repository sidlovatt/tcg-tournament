'use client'
import { useState, useEffect, useCallback } from 'react'

export default function Timer({ timerStartedAt, timerPausedAt, timerMinutes, isTD, onAction }) {
  const [remaining, setRemaining] = useState(timerMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)

  const calcRemaining = useCallback(() => {
    if (!timerStartedAt) return timerMinutes * 60
    const totalSecs = timerMinutes * 60
    const start = new Date(timerStartedAt).getTime()
    const now = timerPausedAt ? new Date(timerPausedAt).getTime() : Date.now()
    const elapsed = Math.floor((now - start) / 1000)
    return Math.max(0, totalSecs - elapsed)
  }, [timerStartedAt, timerPausedAt, timerMinutes])

  useEffect(() => {
    setIsRunning(!!timerStartedAt && !timerPausedAt)
    setRemaining(calcRemaining())
  }, [timerStartedAt, timerPausedAt, calcRemaining])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setRemaining(calcRemaining())
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, calcRemaining])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isWarning = remaining <= 300 && remaining > 0
  const isExpired = remaining === 0 && timerStartedAt

  const colorClass = isExpired
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-emerald-400'

  return (
    <div className="bg-slate-800 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Round Timer</p>
      <div className={`text-5xl font-mono font-bold tabular-nums ${colorClass}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      {isExpired && (
        <p className="text-red-400 text-sm font-semibold mt-1 animate-pulse">TIME — Finish current game</p>
      )}
      {isWarning && !isExpired && (
        <p className="text-amber-400 text-sm mt-1">5 minutes remaining</p>
      )}
      {isTD && (
        <div className="flex gap-2 mt-3 justify-center">
          {!isRunning ? (
            <button
              onClick={() => onAction('start')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              {timerPausedAt ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={() => onAction('pause')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              Pause
            </button>
          )}
          <button
            onClick={() => onAction('reset')}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
