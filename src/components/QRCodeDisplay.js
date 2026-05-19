'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ url, code, small = false, hideCode = false }) {
  const size = small ? 100 : 160
  return (
    <div className="bg-white rounded-xl p-3 inline-block">
      <QRCodeSVG value={url} size={size} />
      {!small && !hideCode && (
        <p className="text-center text-slate-800 font-mono font-bold tracking-widest mt-2 text-lg">
          {code}
        </p>
      )}
    </div>
  )
}
