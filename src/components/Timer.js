'use client'
import { useState, useEffect, useCallback } from 'react'

export default function Timer({ timerStartedAt, timerPausedAt, timerMinutes, isTD, onAction, large = false, fillScreenAt = 0 }) {
  const [remaining, setRemaining] = useState(timerMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)

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

  const isExpiredNow = remaining === 0 && !!timerStartedAt && !timerPausedAt

  useEffect(() => {
    if (!isExpiredNow) { setIsFlashing(false); return }
    setIsFlashing(true)
    const t = setTimeout(() => setIsFlashing(false), 60000)
    return () => clearTimeout(t)
  }, [isExpiredNow])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isWarning = remaining <= 300 && remaining > 0
  const isExpired = remaining === 0 && timerStartedAt

  const colorClass = isExpired
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-emerald-400'

  const showFullscreen = fillScreenAt > 0 && remaining <= fillScreenAt && remaining > 0

  return (
    <>
      {isFlashing && (
        <div className="fixed inset-0 bg-red-600 animate-flash-red pointer-events-none z-50" />
      )}
      {showFullscreen && (
        <div className="fixed inset-0 bg-slate-950 z-40 flex flex-col items-center justify-center">
          <p className="text-slate-500 uppercase tracking-widest text-2xl mb-6">Round Timer</p>
          <div className={`font-mono font-bold tabular-nums leading-none ${colorClass}`} style={{ fontSize: '20vw' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <p className="text-amber-400 text-3xl mt-6 animate-pulse">Final minute · finish your game</p>
        </div>
      )}
    <div className="bg-slate-800 rounded-xl p-4 text-center">
      <p className={`text-slate-500 uppercase tracking-wider mb-1 ${large ? 'text-base' : 'text-xs'}`}>Round Timer</p>
      <div className={`font-mono font-bold tabular-nums ${colorClass} ${large ? 'text-8xl' : 'text-5xl'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      {isExpired && (
        <p className={`text-red-400 font-semibold mt-1 animate-pulse ${large ? 'text-2xl' : 'text-sm'}`}>TIME · Finish current game</p>
      )}
      {isWarning && !isExpired && (
        <p className={`text-amber-400 mt-1 ${large ? 'text-xl' : 'text-sm'}`}>5 minutes remaining</p>
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
    </>
  )
}
