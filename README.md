
# Mokado — Web MVP

A minimal web-based MVP for a digital coffee loyalty app using Supabase for auth and storage. Includes **Demo Mode** (no backend) and a **printable QR** page.

## Quick start (Demo Mode, zero setup)
1. Create `.env` with:
   ```
   VITE_DEMO=true
   ```
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Sign up with any email/password. A sample café **“Mokado Espresso Bar”** exists with PIN **1234**, threshold **5**.
4. Use Owner → **Print QR** to print `/scan?cafe=<id>`.

## Supabase setup (real backend)
1. Create a Supabase project and set `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
2. Run SQL in `supabase/schema.sql` then `supabase/extras.sql`.
3. Enable **Email** auth provider.
4. Run locally or deploy to Vercel/Netlify.

## Deploy to Vercel
- Repo includes `vercel.json`. Add env vars in Vercel and deploy.

