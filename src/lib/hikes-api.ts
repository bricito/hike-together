Skip to content
bricito
hike-together
Repository navigation
Code
Issues
Pull requests
Agents
Actions
Projects
Security and quality
1
 (1)
Insights
Settings
Files
hikes-api.ts
.github
.lovable
functions/api
public
src
assets
components
hooks
integrations
lib
auth-context.tsx
error-capture.ts
error-page.ts
firebase.ts
hikes-api.ts
hikes-data.ts
messages-api.ts
onesignal.ts
reviews-api.ts
stripe-client.ts
utils.ts
pages
routes
hikes
__root.tsx
about.tsx
auth.callback.tsx
checkin.tsx
create.tsx
hikes.$slug.tsx
hikes.index.tsx
how-it-works.tsx
index.tsx
legal.tsx
login.tsx
me.tsx
messages.$hikeId.tsx
messages.index.tsx
my-hikes.tsx
notifications.tsx
popular-trails.tsx
privacy.tsx
profile.$id.tsx
reset-password.tsx
safety.tsx
signup.tsx
super-admin-8472.tsx
who-we-are.tsx
routeTree.gen.ts
router.tsx
server.ts
start.ts
styles.css
supabase
worker
.env
.gitignore
.prettierignore
.prettierrc
CNAME
OneSignalSDKUpdaterWorker.js
OneSignalSDKWorker.js
components.json
eslint.config.js
manifest.webmanifest
package.json
supabase-migration.sql
tsconfig.json
vercel.json
vite.config.ts
wrangler.jsonc
hike-together/src/lib
/
hikes-api.ts
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing hikes-api.ts file contents
  1
  2
  3
  4
  5
  6
  7
  8
  9
 10
 11
 12
 13
 14
 15
 16
 17
 18
 19
 20
 21
 22
 23
 24
 25
 26
 27
 28
 29
 30
 31
 32
 33
 34
 35
 36
import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/hikes-data";

export type DbHike = {
  id: string;
  slug: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string;
  meeting_point: string | null;
  starts_at: string;
  duration_hours: number | null;
  difficulty: Difficulty;
  distance_km: number | null;
  elevation_m: number | null;
  max_participants: number;
  equipment: string[] | null;
  cover_image: string | null;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  organizer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    hiking_level: string | null;
  } | null;
  participants_count?: number;
};

export type HikeView = {
  id: string;
  slug: string;
  title: string;
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
 
