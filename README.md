# Hundred Dollar Draft

Pick **Anime**, **Pokémon**, **Superheroes**, **Football**, **Cricket** or **Food** (pizza or burger). Each turn you're dealt **5 random cards** at different prices.
Buy one, pass the turn, and keep going until your **$100** runs out. Best team wins.

Play solo against bots, or with up to 5 friends on the same Wi-Fi.

## Run it

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install     # first time only
npm start       # http://localhost:3000
```

The terminal also prints a **"Friends on Wi-Fi"** address (like `http://192.168.1.20:3000`).
Friends open that on their phone or laptop, choose a category, tap **Join a game**, and type your room code.

| Command | What it does |
|---|---|
| `npm start` | Start the game server |
| `npm run dev` | Start the server and restart it automatically when you edit a file |
| `npm run images` | Download card photos for every market that has them. See "Card photos" below |
| `npm test` | Run the tests (bot games in every market, plus a real two-player game over the server) |
| `PORT=8080 npm start` | Use a different port |

## Auction rules

- Each card **opens at its price**: a $3 card starts at $3 and a $15 Icon at $15. After that, every bid must beat the current one.
- If nobody bids, the card comes back at the end of the queue at about **60% of its price** (a *second chance*, like
  an accelerated round in real auctions). A card nobody wants even at $1 is dropped.
- You can never bid so much that you couldn't fill your remaining slots with the cheapest cards left.
- The auction uses an **auction list** of about 1.6 cards per empty slot, drawn from the deck, so cards are scarce
  enough to fight over. Fresh cards come in from the rest of the deck only if the list runs short.
- A value helper shows whether the current price is *good value*, *fair* or *pricey* for the card's rating,
  and your budget per remaining card.

**Legends are rare.** Football and Cricket each use a random 8 of their 29 legends per game, and in every market
legends (or the top price band) make up only about 5–7% of the cards dealt, never more than one per hand.
(`ICONS_PER_GAME` and `RARE_SHARE` in `shared/engine.js`.)

**Auction bots** mark the cards that would improve their team most as *targets* and keep raising on those,
while ignoring cards they don't need. They have three personalities: *aggressive* (answers fast, jumps the bidding), *balanced* and
*bargain hunter* (bids late). Every bid makes them re-think, so a human bid gets answered within about a second.
`node scripts/bot-balance.mjs` measures how often bots contest your bids and how often a player wins.

## Playing online with friends anywhere

See **[DEPLOY.md](DEPLOY.md)**: the multiplayer server goes on Render (it needs WebSockets, which Vercel can't
run), and the website on Vercel or on Render itself. Files involved: `render.yaml`, `vercel.json`,
`scripts/build-web.mjs`, `public/config.js`.

## Playing on a phone

The game is built phone-first:

- All 5 cards fit on screen (3 on top, 2 below), with no sliding. **One tap buys a card.** Taps in the first moment
  after a new hand appears are ignored, so a double tap can't buy a card you never saw.
- When anyone picks, the chosen card lifts and glows, the others drop away, and it flies into that player's team.
- A bottom tab bar switches between **Play**, **Teams** and **Picks**. It jumps back to Play when your turn starts.
- Your own team shows under your cards. Phones vibrate on your turn and on a purchase (Android; iPhones don't allow this for websites).

**Install it like an app:** open the game in Chrome on Android and choose *Install app*, or in Safari on iPhone use
*Share → Add to Home Screen*. It opens full screen with its own icon, and solo games work without internet.
(Browsers only allow installing from `https://` or `localhost`. On your Wi-Fi address it still plays, but it can't be installed.)

**Next step for the app stores:** wrap this same code with [Capacitor](https://capacitorjs.com) to produce real
Android (Play Store) and iOS (App Store) builds, and host the multiplayer server online so friends can play from anywhere.

## Card photos

`npm run images` downloads a photo for every football, cricket, anime, Pokémon and superhero card, crops it to the card shape and
saves it as a small WebP in `public/images/`. Cards without a photo keep their coloured art.

| Market | Source | Can you publish it? |
|---|---|---|
| Football, Cricket | Wikimedia Commons (free licences) | **Yes**, the credits screen names each photographer and licence |
| Anime | AniList | **No, private use only.** The art belongs to the studios |
| Pokémon | Official artwork via PokeAPI | **No, private use only.** © Nintendo / Game Freak / The Pokémon Company |
| Superheroes | Open Superhero API | **No, private use only.** © Marvel / DC |

Cricket photos prefer **match photos** (players in kit) found on Wikimedia Commons, and some were chosen by hand.
To change one, run `node scripts/photo-candidates.mjs sheet.jpg "Player Name"`, look at the numbered options,
and put the chosen file title in `PHOTO_PICKS` in `scripts/fetch-images.js` (or add the player to `NO_PHOTO`).

For a public version, replace the private-use images with commissioned or licensed art.
Pokémon prices and power are based on each Pokémon's real base-stat total from PokeAPI.

```bash
npm run images -- --only=football     # just one market
npm run images -- --redo=Goku,Levi    # re-download specific cards
npm run images -- --force             # re-download everything
```

To use your **own** image for a card, save it as `public/images/<football|anime>/<name>.webp`
and update its entry in `public/images/manifest.json`. `public/images/anime/` is in `.gitignore`
and the same goes for `pokemon/` and `heroes/`, so that art isn't accidentally published.

## How the code is organised

```
public/              What the browser loads
  index.html         The page shell
  css/styles.css     All styling
  js/main.js         Controller: clicks, solo game loop, talking to the server
  js/views.js        Screens: home, setup, lobby, game, results
  js/state.js        Shared app state
  js/net.js          WebSocket connection
  js/fx.js           Sound, confetti, card tilt, flying cards
  manifest.webmanifest, sw.js, icons/   Installable app (home screen icon, offline solo)
  images/            Card photos + manifest.json (made by npm run images)
shared/              Used by BOTH the browser and the server
  themes.js          Every card: name, price, rating, category, combos, scoring rules
  football-cards.js  FIFA-style extras: nations, six stats per player, legendary Icons
  cricket-cards.js   The same for cricket, with 29 cricket legends
  engine.js          Game rules: turns, 5-card hands, auction, bots
server/
  index.js           Serves the files and accepts WebSocket connections
  rooms.js           Multiplayer rooms (the server owns the game, so nobody can cheat)
scripts/
  fetch-images.js    Downloads and resizes card photos (PHOTO_PICKS = hand-picked cricket photos)
  photo-candidates.mjs  Contact sheet of photo options, for choosing photos by eye
  make-icons.mjs     Builds the app icons
  bot-balance.mjs    Measures how hard auction bots fight against human-style players
test/                node:test tests
legacy/              The original single-file version
```

## Football and Cricket: FIFA-style cards and legends

Football cards look like FIFA Ultimate Team cards (our own design, not EA's artwork): rating, position,
nation flag, photo and six stats, on a bronze, silver or gold card by rating. 29 legends (Pelé, Maradona,
Zidane, Ronaldo Nazário, Cruyff…) appear as rare cream **Icon** cards costing $10–15.

Stats are our own estimates, and they score: *Rapid attack* (forwards average pace 88+), *Brick wall*
(defenders average defending 86+), *Midfield maestros* (passing 88+), *Clinical finisher* (shooting 93+),
*Safe hands* (keeper reflexes 90+) and *Hall of fame* (3+ Icons). Edit players and stats in `shared/football-cards.js`.

Cricket uses the same card design with batting, bowling, fielding (keeping for wicketkeepers), power, technique and
temperament, plus 29 legends (Tendulkar, Bradman, Lara, Warne, Muralitharan, Kallis…). Its bonuses are *Top order*,
*Bowling attack*, *Big hitters*, *Gun fielders*, *Nerves of steel* and *Hall of fame*. Data: `shared/cricket-cards.js`.

## Common changes

- **Add or reprice a card:** edit the `items` list for that market in `shared/themes.js`.
  Each row is `[name, price, rating, category, extra]`.
- **Add a combo:** add `[label, [card names], bonus]` to that market's `combos`.
- **Add a new market (e.g. Cricket):** copy one of the entries in `THEMES` in `shared/themes.js`,
  then add a tile for it in `homeView()` in `public/js/views.js`.
- **Change the budget, hand size or timers:** `BUDGET` in `shared/themes.js`; `HAND_SIZE`, `TURN_MS`
  and the auction timings at the top of `shared/engine.js`.

After changing cards, run `npm test`. It checks that games still finish and that nearly every team can be completed.
