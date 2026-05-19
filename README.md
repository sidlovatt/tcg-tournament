# TCG Tournament Manager

Run Swiss and Knockout TCG tournaments at home. Players join on their phones, submit results live, standings update in real time.

## Features

- **Swiss** — full OMW%/GWP%/OGWP% tiebreakers, byes, correct round counts
- **Single Elimination** — seeded bracket, auto-bye handling
- **Double Elimination** — two lives, losers bracket
- **Room codes** — 6-char code, QR codes for players and spectators
- **Live timer** — per-round countdown, TD-controlled, synced across all devices
- **Realtime** — Supabase live updates, no page refresh needed
- **Auto-cleanup** — tournaments deleted after 24 hours
- Game presets: Gundam TCG, MTG, Pokemon, Yu-Gi-Oh!, One Piece, FaB, DBS, Digimon, Lorcana

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run everything in `supabase/schema.sql`
3. (Optional) Enable pg_cron cleanup: Dashboard → Database → Extensions → enable `pg_cron`, then:
   ```sql
   select cron.schedule('cleanup-expired', '0 * * * *', 'select delete_expired_tournaments()');
   ```
4. Copy your project URL and anon key from **Settings → API**

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy — Vercel auto-deploys on every push to main

## How to Run a Tournament

### Tournament Director (TD)

1. Go to the site → **Create Tournament**
2. Choose format, game, timer, add players → **Start Tournament**
3. You get a room code and QR codes — share with players
4. Click **Start Round 1** to generate pairings
5. Use the timer, override results if needed
6. Advance rounds when all results are submitted
7. Swiss: finishes after correct number of rounds
8. Knockout: continues until one player remains

### Players

1. Scan QR code or go to `/room/[CODE]/play`
2. Tap your name
3. See your pairing and opponent's table
4. Submit result after your match
5. Wait for TD to start next round

### Spectators

- Scan QR code or go to `/room/[CODE]/standings`
- Live standings update automatically

## Routes

| Path | Who | What |
|------|-----|------|
| `/` | Everyone | Home — create or join |
| `/create` | TD | Tournament setup wizard |
| `/room/[code]` | TD/Spectator | TD dashboard, all pairings |
| `/room/[code]/play` | Players | Join, see pairing, submit result |
| `/room/[code]/standings` | Spectators | Live standings / bracket |

## Swiss Rules

- **3 pts** win, **1 pt** draw, **0 pts** loss
- **Tiebreakers:** OMW% → GWP% → OGWP% (all floored at 33%)
- **Byes:** automatic win, 3 pts, excluded from OMW% calc
- **No rematches** — algorithm avoids repeat pairings
- **Rounds:** standard WotC counts (8 players = 3 rounds, 16 = 4, etc.)

## Tech Stack

- **Next.js** (App Router, JavaScript)
- **Supabase** (PostgreSQL + Realtime subscriptions)
- **Tailwind CSS**
- **qrcode.react**
- Deployed on **Vercel**
