# BlablaHike — Architecture Plan (SPA + Supabase + Hostinger)

## Goal
Convert the current TanStack Start project into a **pure React SPA** (Vite + React Router) deployable as static files on **Hostinger Web Hosting**, backed by your **own Supabase project** for auth, database, real-time join requests, messaging and notifications.

---

## 1. Frontend stack change

Hostinger shared/web hosting only serves static files — no Node, no SSR. So we drop TanStack Start.

- **Remove**: `@tanstack/react-start`, `@tanstack/react-router`, `wrangler`, `src/server.ts`, `src/start.ts`, `src/routes/__root.tsx` SSR shell, generated `routeTree.gen.ts`.
- **Add**: `react-router-dom` v6, `react-helmet-async` (for per-page SEO meta in SPA), `@supabase/supabase-js`.
- **Keep**: Vite, Tailwind, shadcn/ui, all existing components (`HikeCard`, `MobileNav`, `SiteHeader`, `SiteFooter`), styles, hike images.
- **Build output**: `dist/` — uploaded to Hostinger `public_html/`.
- **SPA routing fix on Hostinger**: ship a `public/.htaccess` that rewrites all unknown paths to `index.html` (Apache fallback for client-side routes).

### SEO without SSR
- `react-helmet-async` per page for `<title>`, meta description, OpenGraph, JSON-LD.
- Static `public/sitemap.xml` + `public/robots.txt`.
- For richer SEO on public hike pages later, we can add `vite-plugin-ssg` prerendering — left as an optional follow-up.

---

## 2. Routes (React Router)

```
/                       Landing + search
/hikes                  Browse all public hikes (filters)
/hikes/:slug            Public hike detail (SEO target)
/login                  Email/Google/Apple login
/signup                 Email signup
/auth/callback          OAuth + email confirmation handler
/reset-password         Set new password (recovery)

— protected (requires session) —
/create                 Create a hike
/messages               Conversations list
/messages/:hikeId       Real-time chat for a hike
/profile                My profile + my hikes + notifications
/profile/:userId        Public profile of another hiker
```

Public hike browsing works without login. The "Request to join" CTA on `/hikes/:slug` redirects to `/login?redirect=/hikes/:slug` if not authenticated.

---

## 3. Supabase backend

### Auth
Enable in your Supabase dashboard:
- Email + password (with confirmation)
- Google OAuth
- Apple OAuth
- Redirect URLs: `http://localhost:8080/auth/callback` and your Hostinger domain `https://yourdomain.com/auth/callback`

### Database schema (migrations)

```text
profiles
  id uuid PK → auth.users(id)
  full_name text, avatar_url text, bio text
  city text, country text
  hiking_level text   -- 'easy' | 'moderate' | 'hard' | 'expert'
  created_at timestamptz

hikes
  id uuid PK, slug text unique
  organizer_id uuid → profiles(id)
  title, description, location, meeting_point text
  latitude, longitude numeric
  starts_at timestamptz, duration_hours int
  difficulty text, distance_km numeric, elevation_gain_m int
  max_participants int, equipment text[]
  cover_image_url text
  status text  -- 'open' | 'full' | 'cancelled' | 'completed'
  created_at timestamptz

hike_participants
  id uuid PK
  hike_id uuid → hikes(id), user_id uuid → profiles(id)
  status text  -- 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at timestamptz
  unique (hike_id, user_id)

messages
  id uuid PK
  hike_id uuid → hikes(id)
  sender_id uuid → profiles(id)
  content text, created_at timestamptz

notifications
  id uuid PK
  user_id uuid → profiles(id)
  type text  -- 'join_request' | 'request_accepted' | 'new_message' | 'hike_reminder'
  payload jsonb
  read_at timestamptz, created_at timestamptz
```

### RLS policies (highlights)
- `profiles`: select public; update only `auth.uid() = id`.
- `hikes`: select public (anonymous browsing); insert/update/delete only by `organizer_id = auth.uid()`.
- `hike_participants`: user can read own rows + organizer can read rows for own hikes; insert by self; update (accept/decline) only by hike organizer.
- `messages`: select/insert restricted to accepted participants + organizer of that hike (security-definer helper `is_hike_member(hike_id, user_id)`).
- `notifications`: select/update only own rows.

### Triggers
- On `auth.users` insert → create `profiles` row (full_name from metadata).
- On `hike_participants` insert → notify organizer (`join_request`).
- On `hike_participants` status → 'accepted' → notify requester (`request_accepted`).
- On `messages` insert → notify all hike members except sender (`new_message`).

### Realtime
Enable Realtime on `messages`, `notifications`, `hike_participants` for live chat, live notification badge, and live join-request updates.

### Storage
Bucket `hike-covers` (public read) and `avatars` (public read), write restricted to owner.

---

## 4. Connecting Supabase

You'll create a Supabase project at supabase.com and provide:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These go in a local `.env` and in Hostinger only matter at build time. Since SPA bundles them at build, you'll rebuild and re-upload `dist/` whenever they change.

A single `src/integrations/supabase/client.ts` exports the typed client used everywhere.

A React `AuthProvider` context wraps the app, exposes `user`, `session`, `signIn`, `signUp`, `signInWithOAuth`, `signOut`, and listens to `onAuthStateChange`. A `<RequireAuth>` wrapper protects private routes.

---

## 5. Deployment to Hostinger

1. `npm run build` locally.
2. Upload contents of `dist/` to `public_html/` via Hostinger File Manager or FTP.
3. Include `public/.htaccess` so deep links don't 404.
4. Configure Supabase Auth → Site URL = your Hostinger domain, add redirect URL `https://yourdomain.com/auth/callback`.

---

## 6. Implementation phases

1. **Strip TanStack Start**, install React Router + Helmet + supabase-js, port existing routes/pages to React Router, add `.htaccess`, verify build runs and current mock UI still works.
2. **Wire Supabase client + AuthProvider**, build real `/login`, `/signup`, `/auth/callback`, `/reset-password`. Then prompt you for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Database migrations** (profiles, hikes, participants, messages, notifications) + RLS + triggers — delivered as SQL you run in your Supabase SQL editor.
4. **Hikes feature**: replace mock data with Supabase queries on `/hikes` and `/hikes/:slug`; implement `/create`.
5. **Join requests**: request-to-join button, organizer accept/decline UI, real-time updates.
6. **Messaging**: per-hike chat with Realtime subscriptions.
7. **Notifications**: bell icon + `/profile` notifications list, real-time badge.
8. **Polish**: SEO meta on every public page, sitemap, JSON-LD on hike pages.

---

## Technical notes

- All Supabase calls go through the browser client with the anon key; security is enforced by RLS, not by hiding the key.
- No Edge Functions needed for the requested features — triggers + RLS cover join requests, messaging, notifications.
- If later you want server-side email sending or Stripe, you can add Supabase Edge Functions without touching the SPA.
- Roles (admin/moderator) are not in scope yet; if needed later we'll add a `user_roles` table + `has_role()` security-definer function (never store roles on `profiles`).

---

Confirm and I'll start with **phase 1 (strip TanStack Start, set up React Router + SPA shell)** so the project builds cleanly for Hostinger before we touch Supabase.