import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — TCG Tournament Manager',
  description: 'Terms of use for TCG Tournament Manager.',
}

export default function TermsPage() {
  return (
    <main className="px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
      <h1 className="text-3xl font-bold text-slate-100 mt-4 mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-slate-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">About the service</h2>
          <p>TCG Tournament Manager is a free tool for running trading card game tournaments. No account, subscription, or payment is required.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Use of the service</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>You may use this service for personal, non-commercial tournaments.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>You are responsible for the conduct of your tournament and the accuracy of results entered.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>Do not enter personally sensitive information as player names or tournament names.</span></li>
            <li className="flex gap-2"><span className="text-violet-400 shrink-0">·</span><span>Do not use the service for any unlawful purpose.</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">No warranty</h2>
          <p>This service is provided <strong className="text-slate-300">"as is"</strong> without any warranty of any kind. We do not guarantee uptime, data retention, or accuracy of Swiss pairings and tiebreakers. Use at your own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Limitation of liability</h2>
          <p>We are not liable for any loss or damage arising from use of this service, including but not limited to lost tournament data, incorrect pairings, or service interruptions. We are not liable for disputes between tournament participants.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Data</h2>
          <p>Tournament data you enter is stored in our database. We may delete data at any time without notice. See our <Link href="/privacy" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</Link> for details on what is collected and how it is used.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Changes to the service</h2>
          <p>We reserve the right to modify, suspend, or discontinue the service at any time without notice. We may update these terms at any time; continued use constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Contact</h2>
          <p>Questions or concerns can be raised via the Feedback button on the site.</p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-800 flex gap-6 text-sm text-slate-600">
        <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
      </div>
    </main>
  )
}
