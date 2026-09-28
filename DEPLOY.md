# Deploying Hundred Dollar Draft online

So friends in any city or country can play together.

**Why two services?** Vercel is great for websites, but it can't run the multiplayer server: it only runs
short-lived functions, and the game needs connections that stay open (WebSockets) plus a server that keeps
running between moves (turn timers, bots). So:

| Part | Service | What it does |
|---|---|---|
| Website | **Vercel** (free) | The page players open |
| Multiplayer server | **Render** (free plan) | Rooms, turns, bots, over WebSockets |

> **Simplest option:** skip Vercel and use only Render. The server also serves the website, so after
> **Step 2** you can just share the Render address. Do Steps 3–4 only if you want the site on Vercel.

---

## Step 1: Put the project on GitHub

Both Vercel and Render deploy straight from a GitHub repository.

1. Create a free account at https://github.com and click **New repository**. Name it `hundred-dollar-draft`.
   Choose **Private** (recommended, see the note on images below). Don't add a README.
2. In Terminal:

```bash
cd ~/Documents/HundredDollarDraft
git init
git add .
git commit -m "Hundred Dollar Draft"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hundred-dollar-draft.git
git push -u origin main
```

**Note on images:** `.gitignore` keeps the anime, Pokémon and superhero art out of Git, because it belongs
to the studios. Online, those cards show the initials design instead. Football, cricket and food photos
are included (they're free-licensed, with credits in the game).

---

## Step 2: Deploy the multiplayer server on Render

1. Sign up at https://render.com (log in with GitHub).
2. Click **New +** → **Blueprint**, pick your `hundred-dollar-draft` repository.
   Render reads `render.yaml` and sets everything up.
3. It will ask for **ALLOWED_ORIGINS**: leave it **empty for now** (we fill it in at Step 4).
4. Click **Apply**. The first deploy takes 2–3 minutes.
5. Copy your server address from the Render dashboard, e.g. `https://hundred-dollar-draft.onrender.com`.
6. Check it's working: open `https://YOUR-RENDER-ADDRESS/health`. You should see `{"ok":true,"rooms":0}`.

✅ **At this point the whole game already works online at your Render address.** If you're happy with
that, share it with friends and you're done.

---

## Step 3: Deploy the website on Vercel

1. Sign up at https://vercel.com (log in with GitHub).
2. Click **Add New…** → **Project**, import `hundred-dollar-draft`.
3. **Framework Preset:** `Other`. Leave the build settings as they are (`vercel.json` sets them).
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `HDD_SERVER_URL` | your Render address from Step 2, e.g. `https://hundred-dollar-draft.onrender.com` |

5. Click **Deploy**. You'll get an address like `https://hundred-dollar-draft.vercel.app`.

If you change `HDD_SERVER_URL` later, redeploy (Deployments → ⋯ → Redeploy) so the site picks it up.

---

## Step 4: Only allow your website to use the server (recommended)

1. In Render, open your service → **Environment**.
2. Set `ALLOWED_ORIGINS` to your Vercel address, e.g. `https://hundred-dollar-draft.vercel.app`
   (no slash at the end; add more addresses separated by commas, like a custom domain).
3. Save. Render restarts the server.

Now other websites can't use your server for their own games.

---

## Step 5: Play with friends

1. Open your Vercel (or Render) address, pick a category, tap **Host a game**.
2. Send friends the address and the 4-letter room code.
3. They open the address, pick any category, tap **Join**, and type the code.

On phones, friends can also install it: **Chrome → Install app** (Android) or **Safari → Share →
Add to Home Screen** (iPhone). It works because both addresses use `https://`.

---

## Good to know

- **Free Render servers sleep after about 15 minutes with nobody connected.** The first person to host
  afterwards waits 30–60 seconds while it wakes up. If Host a game shows "Couldn't reach the game server",
  wait a moment and try again. Render's paid Starter plan (about $7/month) never sleeps.
- **Solo games don't need the server:** they run entirely on the player's phone or computer.
- **Updating the game:** push to GitHub (`git add . && git commit -m "update" && git push`). Render and Vercel
  redeploy automatically.
- **Restarting the server ends any games in progress** (rooms live in memory). Deploy when nobody's playing.
- **Custom domain:** both Vercel and Render let you add your own domain (e.g. `hundreddollardraft.com`).
  Add it to `ALLOWED_ORIGINS` too.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Couldn't reach the game server" | Render is waking up (wait 60s), or `HDD_SERVER_URL` on Vercel is wrong. Check `https://YOUR-RENDER-ADDRESS/health`. |
| Works on Render's address but not on Vercel | `ALLOWED_ORIGINS` doesn't exactly match the Vercel address (check `https` and no trailing `/`). |
| Vercel still connects to the old server | Redeploy on Vercel after changing `HDD_SERVER_URL`. |
| Friends see an old version | Their browser cached the app. Pull down to refresh, or close and reopen the installed app. |
