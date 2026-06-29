# RahiCab — Deployment Guide

Going live with: **Frontend on Vercel** · **Backend on Railway** · **Database on Neon (PostgreSQL)** · **Domain `rahicab.in` on GoDaddy**

```
  rahicab.in (Vercel)  ──►  api.rahicab.in (Railway)  ──►  Neon PostgreSQL (Singapore)
   React frontend            Spring Boot backend            persistent database
```

---

## 0. Prerequisites (one-time)

- [ ] Code pushed to GitHub
- [ ] Neon PostgreSQL project created (✅ done — `rahicab`, Singapore region)
- [ ] `rahicab.in` owned on GoDaddy (✅ done)

Push the latest code:
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs
git add .
git commit -m "Production config: prod profile, PostgreSQL, dynamic port"
git push
```

> The secrets in `application.properties` are **test** keys (Razorpay test, dev Google key). Real production secrets live in the host's env vars, never in the repo. `application-prod.properties` contains only `${ENV_VAR}` references — nothing sensitive.

---

## 1. Database — Neon PostgreSQL ✅ (already done & verified)

Connection string (from Neon dashboard):
```
postgresql://neondb_owner:npg_rX38MIVPpFjd@ep-long-lake-aoaof0rp.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Mapped to backend env vars (note the added `jdbc:` prefix):
```
DB_URL=jdbc:postgresql://ep-long-lake-aoaof0rp.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=neondb_owner
DB_PASSWORD=npg_rX38MIVPpFjd
```

> ⚠️ If this password is ever exposed, rotate it: Neon dashboard → Settings → Reset password → update `DB_PASSWORD`.

**Verified:** connection works, tables auto-create, data persists across restarts.

---

## 2. Backend — Railway

> Railway gives a **$5 one-time trial credit**, then ~**$5/month** (Hobby plan). For a genuinely free option use Render instead (caveat: app sleeps after 15 min idle).

### Deploy
1. [railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → select the `rahiCabs` repo
3. Open the service → **Settings** → **Root Directory** → set to **`backend`**
4. Railway auto-detects Maven + Spring Boot, builds with Java 21 (pinned in `pom.xml`)

### Environment variables
Settings → **Variables** → Raw Editor → paste:
```
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://ep-long-lake-aoaof0rp.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=neondb_owner
DB_PASSWORD=npg_rX38MIVPpFjd
JWT_SECRET=<generate a new long random string — see note below>
GOOGLE_MAPS_KEY=AIzaSyAr3AgCh-XDEv5mC3sZHREQuCjCyLp5cVA
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
CORS_ORIGINS=https://rahicab.in,https://www.rahicab.in
OWNER_ADMIN_PASSWORD=<your chosen admin password>
```
Optional (notifications — leave out to keep disabled):
```
SMS_ENABLED=true
MSG91_AUTHKEY=xxxxx
MSG91_TEMPLATE_ID=xxxxx
MSG91_SENDER_ID=RAHICB
EMAIL_ENABLED=true
MAIL_USERNAME=youremail@gmail.com
MAIL_PASSWORD=<16-char Gmail app password>
```

> Do **not** set `PORT` — Railway injects it automatically (app reads `${PORT}`).
> Generate a strong `JWT_SECRET`: run `openssl rand -base64 48` in a terminal.

### Custom domain
1. Settings → **Networking** → **Custom Domain** → enter `api.rahicab.in`
2. Railway shows a **CNAME target** like `xxxx.up.railway.app` — **copy it** (used in GoDaddy step 4)

### Verify
Deploy logs should show:
- `HikariPool-1 - Start completed` (connected to Neon)
- `Started RahiCabsApplication`

---

## 3. Frontend — Vercel

1. [vercel.com](https://vercel.com) → **Login with GitHub** → **Add New Project** → import `rahiCabs`
2. **Root Directory** → set to **`frontend`**
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`
4. **Environment Variables** → add:
   ```
   VITE_API_URL=https://api.rahicab.in/api
   VITE_GOOGLE_MAPS_KEY=AIzaSyAr3AgCh-XDEv5mC3sZHREQuCjCyLp5cVA
   ```
5. **Deploy**

### Custom domain
1. Project → Settings → **Domains** → add `rahicab.in` and `www.rahicab.in`
2. Vercel shows the DNS records to use (copy for GoDaddy step 4)
3. Vercel auto-issues free SSL once DNS resolves

---

## 4. DNS — GoDaddy

Sign in → **My Products** → `rahicab.in` → **DNS** (Edit DNS).

GoDaddy auto-appends `.rahicab.in`, so **Name** is just `api`, `www`, or `@`.

| # | Type  | Name | Value                                   | TTL    |
|---|-------|------|-----------------------------------------|--------|
| 1 | CNAME | api  | `xxxx.up.railway.app` (from Railway)    | 600s   |
| 2 | A     | @    | `76.76.21.21` (Vercel — confirm in UI)  | 600s   |
| 3 | CNAME | www  | `cname.vercel-dns.com` (confirm in UI)  | 600s   |

> ⚠️ **GoDaddy gotcha:** a fresh domain ships with default parking records on `@` (A) and `www` (CNAME). You must **EDIT** those existing rows (pencil icon) — GoDaddy won't allow duplicate Name+Type. The `api` CNAME is usually new, so **Add** it.

Check propagation at [dnschecker.org](https://dnschecker.org) (enter `api.rahicab.in` and `rahicab.in`). Usually 10–60 min.

---

## 5. Order of operations (do not skip)

1. ☐ Deploy **backend** on Railway → add `api.rahicab.in` → copy CNAME target
2. ☐ Deploy **frontend** on Vercel → add `rahicab.in` + `www` → copy DNS values
3. ☐ Add all 3 records in **GoDaddy** with the copied targets
4. ☐ Wait for DNS + SSL (green on dnschecker, "verified" on Railway/Vercel)
5. ☐ Confirm Railway `CORS_ORIGINS=https://rahicab.in,https://www.rahicab.in` → redeploy if changed

CORS is set last because the backend must know the live frontend domain. **If API calls fail with a CORS error in the browser console, this is the cause.**

---

## 5b. SEO assets (before/at launch)

- [ ] **Add the social-share image.** `index.html` references `https://rahicab.in/og-image.png` for WhatsApp/Facebook/Twitter previews, but the file doesn't exist yet. Create a **1200×630px** banner (logo + "Premium Cab Service in Bihar" + a car image — free templates on Canva) and save it as **`frontend/public/og-image.png`**. Until added, shared links show a text-only preview (still works, just no image).
- [ ] **Update the phone number** in the JSON-LD structured data in `frontend/index.html` (currently the placeholder `+91-99999-99999`) — this is what shows in Google's local listings.
- [ ] After deploy, submit `https://rahicab.in/sitemap.xml` in [Google Search Console](https://search.google.com/search-console) to speed up indexing.
- [ ] Test your link preview at [opengraph.xyz](https://www.opengraph.xyz) by pasting `https://rahicab.in`.

## 6. Go-live checklist (before real customers)

- [ ] **Razorpay** → switch test keys to **live** keys (`rzp_live_...`) in Railway vars
- [ ] **JWT_SECRET** → unique strong value (not the dev default)
- [ ] **OWNER_ADMIN_PASSWORD** → change from default `Rahi@Admin2026`
- [ ] **Google Maps key** → restrict by HTTP referrer (`https://rahicab.in/*`) for the frontend; use a separate unrestricted/IP-restricted key for the backend Distance Matrix calls
- [ ] **Email/SMS** → add Gmail app password + MSG91 DLT-approved template (SMS legally requires DLT approval in India)
- [ ] **ddl-auto** → after first successful deploy creates tables, change `application-prod.properties` `spring.jpa.hibernate.ddl-auto` from `update` to `validate`
- [ ] Remove the default admin (`admin@rahicabs.com / admin123`) from `DataInitializer` or change its password

---

## 7. Post-launch improvements (not blockers)

- [ ] **Homepage pre-rendering (SEO Tier 2).** App is a client-rendered SPA — Google renders it fine and social/WhatsApp previews already work via Open Graph tags, but pre-rendering the landing page boosts rankings and non-Google crawlers. Do this with `vite-react-ssg` (Vercel-safe, Node-based — avoid `react-snap`, it breaks Vercel builds) on a **separate branch** and test every route + auth flow before merging. Groundwork done: `CustomerContext` is already SSR-safe.
- [ ] **Connection pooling at scale.** If concurrent users grow past ~200, raise HikariCP `maximum-pool-size` and consider Redis caching for fare lookups.

## Admin login (after deploy)

| | Email | Password |
|---|-------|----------|
| Owner | `shubhamchouhan0007@gmail.com` | `Rahi@Admin2026` (or `OWNER_ADMIN_PASSWORD`) |
| Default | `admin@rahicabs.com` | `admin123` (remove before launch) |

Log in via the **Partner / Staff login** on `/login`.

---

## Quick reference — all env vars

**Railway (backend):** `SPRING_PROFILES_ACTIVE`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `GOOGLE_MAPS_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CORS_ORIGINS`, `OWNER_ADMIN_PASSWORD` (+ optional SMS/email)

**Vercel (frontend):** `VITE_API_URL`, `VITE_GOOGLE_MAPS_KEY`
