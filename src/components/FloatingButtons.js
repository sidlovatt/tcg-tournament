'use client'
import { useState } from 'react'
import { CHANGELOG } from '@/lib/changelog'

export default function FloatingButtons() {
  const [panel, setPanel] = useState(null) // 'feedback' | 'changelog' | null
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('') // 'sending' | 'sent' | 'error'

  async function submitFeedback(e) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, page: typeof window !== 'undefined' ? window.location.pathname : '' }),
    })
    if (res.ok) { setStatus('sent'); setMessage('') }
    else setStatus('error')
  }

  return (
    <>
      {/* Backdrop */}
      {panel && (
        <div className="fixed inset-0 z-40" onClick={() => { setPanel(null); setStatus('') }} />
      )}

      {/* Panel */}
      {panel === 'feedback' && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-slate-100 font-semibold mb-1">Send Feedback</h3>
          <p className="text-slate-500 text-xs mb-3">Bug reports, suggestions, anything.</p>
          {status === 'sent' ? (
            <p className="text-emerald-400 text-sm text-center py-4">Thanks for the feedback!</p>
          ) : (
            <form onSubmit={submitFeedback} className="space-y-2">
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setStatus('') }}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
              {status === 'error' && <p className="text-red-400 text-xs">Failed to send — try again</p>}
              <button
                type="submit"
                disabled={status === 'sending' || !message.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                {status === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      )}

      {panel === 'changelog' && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl max-h-96 overflow-y-auto">
          <h3 className="text-slate-100 font-semibold mb-3">What&apos;s New</h3>
          {CHANGELOG.map(entry => (
            <div key={entry.date} className="mb-4">
              <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">{entry.date}</p>
              <ul className="space-y-1">
                {entry.changes.map((c, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-slate-600 shrink-0">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Floating buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        <button
          onClick={() => setPanel(p => p === 'changelog' ? null : 'changelog')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-xl shadow-lg transition-colors"
        >
          What&apos;s New
        </button>
        <button
          onClick={() => { setPanel(p => p === 'feedback' ? null : 'feedback'); setStatus('') }}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-xl shadow-lg transition-colors"
        >
          Feedback
        </button>
      </div>
    </>
  )
}
