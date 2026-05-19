'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ url, code }) {
  return (
    <div className="bg-white rounded-xl p-4 inline-block">
      <QRCodeSVG value={url} size={160} />
      <p className="text-center text-slate-800 font-mono font-bold tracking-widest mt-2 text-lg">
        {code}
      </p>
    </div>
  )
}
