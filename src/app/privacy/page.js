import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — TCG Tournament Manager',
  description: 'How TCG Tournament Manager collects and uses your data.',
}

export default function PrivacyPage() {
  return (
    <main className="px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
      <h1 className="text-3xl font-bold text-slate-100 mt-4 mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">What we collect</h2>
          <p className="text-slate-400 mb-3">TCG Tournament Manager collects only what is necessary to run tournaments:</p>
          <ul className="space-y-2 text-slate-400">
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span><strong className="text-slate-300">Tournament data</strong> — name, format, game type, timer settings, round results. Entered by the Tournament Director.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span><strong className="text-slate-300">Player names</strong> — names entered by the Tournament Director or by players when joining a room. These are not linked to any account or identity.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span><strong className="text-slate-300">Match results</strong> — wins, losses, draws submitted during each round.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span><strong className="text-slate-300">Feedback messages</strong> — if you submit feedback via the Feedback button, the message and the page you were on are stored.</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">What stays on your device</h2>
          <p className="text-slate-400">Your browser's local storage is used to remember which tournament rooms you created as a Tournament Director. This data never leaves your device and is not sent to any server.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Where data is stored</h2>
          <p className="text-slate-400">Tournament and player data is stored in <strong className="text-slate-300">Supabase</strong>, a cloud database provider. Supabase may collect technical data such as IP addresses and timestamps as part of their infrastructure. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">supabase.com/privacy</a> for their policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">What we do not collect</h2>
          <ul className="space-y-2 text-slate-400">
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>Email addresses or any contact information from users</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>User accounts or login credentials</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>Payment or financial information</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>Analytics, tracking pixels, or advertising data</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Data retention</h2>
          <p className="text-slate-400">Tournament data is retained indefinitely at present. There is no automatic deletion. If you would like your data removed, use the Feedback button on the site.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Cookies</h2>
          <p className="text-slate-400">This site does not set cookies. We use browser local storage (not cookies) to track TD room access. Your browser or device may set technical cookies for other purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Changes to this policy</h2>
          <p className="text-slate-400">We may update this policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-800 flex gap-6 text-sm text-slate-600">
        <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
      </div>
    </main>
  )
}
