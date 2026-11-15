# WineCellar

A wine log for you and your friends: check in the wines you drink, see what friends are drinking, and keep track of the bottles you have at home. No ads.

React + TypeScript + Vite + Tailwind, with Firebase (Auth, Firestore, Storage) as the backend. Deploys to Vercel as a static site.

## What it does

- **Accounts**: email/password and Google sign-in, unique usernames, profile photo and bio.
- **Check-ins**: editable afterwards (pencil on your own check-ins); a bottle you have at home is picked from your cellar automatically, and extra bottles you bought can go into the cellar from the same form; a score out of 10 on a slider in steps of 0.25, a bottle or by the glass (number of glasses, price per glass, bar or restaurant), rating in half stars, vintage, date, store, price, tasting notes, flavour tags, occasion, food pairing, location, friends you drank with, "would buy again", and an "only me" switch.
- **Two kinds of photos**: *bottle photos* go onto the wine's page so everyone recognises the bottle; *moment photos* stay on the check-in. Several of each, straight from the camera or the library. Camera shots can be saved to the phone too (share sheet → Save Image).
- **Feed**: your and your friends' check-ins, with cheers and comments.
- **Friends**: search by name or username, share an invite link to your profile, send / accept / decline requests.
- **Catalogue**: about 315 starter wines (red, white, rosé, sparkling, champagne, orange, dessert, fortified), with Albert Heijn and Gall & Gall ranges and Rotterdam wine shops. Anyone can add wines and stores by hand, also straight from the Cellar tab; those wines show up in everyone's search. Details not right? "Edit details" (on the wine's page, when adding it to the cellar, or when logging it) changes a wine you added in place; anyone else's wine, or a catalogue wine, is saved as your own new version, so both show in search. A wine's picture is the newest bottle photo anyone took of it, from a check-in, the cellar form or the wine's page.
- **Producers**: about 370 to pick from when adding a wine; a producer that isn't listed is saved for next time. Each has a page with its wines.
- **Cellar**: add bottles straight from the Cellar tab (a wine that isn't in the catalogue is added in the same form) or from a wine's page; bottles at home with quantity, vintage, price, storage spot and drinking window; "Open a bottle" pops the cork (a short animation, tap to skip), logs it and asks whether you finished it: finished takes it off stock, "some left" keeps it in the cellar marked as open until you tap "Finished".
- **Wishlist** and a **Buy again** list.
- **Profile**: every wine you've tasted (search and sort), taste profile and badges built from your check-ins. Under *Edit profile* you choose what friends see on yours: your history (on by default) and your cellar (off by default; prices and notes stay private).
- **Store pages**: which wines were found where, and what you spent there.
- Installable on a phone's home screen.

## Setup

### 1. Firebase console

1. **Authentication → Sign-in method**: enable *Email/Password* and *Google*.
2. **Firestore Database**: create it if you have not yet (region `europe-west4` is the Netherlands).
3. **Storage**: click *Get started*. Storage requires the Blaze (pay-as-you-go) plan; it has a free allowance, but you need to attach a billing account. Without Storage everything works except photos.
4. **Project settings → General → Your apps**: add a Web app and copy the config values.

### 2. Rules and index

The rules in this repo replace the "deny everything" rules. Deploy them with the Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use --add          # pick your project
firebase deploy --only firestore,storage
```

Or paste `firestore.rules` and `storage.rules` into the *Rules* tabs in the console. The feed needs one composite index (`firestore.indexes.json`); if you skip the CLI, the browser console prints a link that creates it. Until the index is ready the feed still works through a slower fallback query.

### 3. Run locally

```bash
cp .env.example .env.local   # fill in the six values from step 1.4
npm install
npm run dev
```

### 4. Vercel

1. Import the GitHub repo in Vercel. The framework preset "Vite" is detected automatically.
2. Add the six `VITE_FIREBASE_*` variables under **Settings → Environment Variables**, then redeploy.
3. In Firebase **Authentication → Settings → Authorized domains**, add your `*.vercel.app` domain, otherwise Google sign-in is blocked.

## How it is put together

```
src/
  lib/firebase.ts      Firebase init from env vars
  lib/db.ts            every Firestore write (profiles, friends, wines, check-ins, cellar)
  lib/images.ts        client-side photo compression + upload
  lib/stats.ts         taste profile and badges
  state/AppContext.tsx live subscriptions: profile, friends, wines, feed, cellar
  data/seedWines.ts    starter catalogue (bundled; copied to Firestore on first use)
  data/seedStores.ts   starter list of Rotterdam stores
  pages/               one file per screen
  components/          shared UI
firestore.rules        security rules
storage.rules          photo upload rules
```

### Data model

| Path | Contents | Who can read |
| --- | --- | --- |
| `users/{uid}` | name, username, photo, bio | any signed-in user |
| `users/{uid}/cellar` | bottles at home | owner, and friends if `shareCellar` is on |
| `users/{uid}/wishlist` | saved wines | owner |
| `usernames/{name}` | uid, keeps usernames unique | signed-in |
| `friendships/{uidA_uidB}` | the two uids, who asked, status | the two people |
| `wines/{id}` | shared catalogue, bottle photos, rating totals | signed-in |
| `producers/{id}` | user-added producers; id is the slug of the name | signed-in |
| `stores/{id}` | user-added stores | signed-in |
| `checkins/{id}` | one logged wine; `visibleTo` lists who may read it | owner + `visibleTo` |
| `checkins/{id}/comments` | comments | whoever can read the check-in |

Privacy works through `visibleTo`: each check-in stores the uids allowed to read it (you and your friends, or only you). The app keeps that list in step with your friend list each time it loads, so new friends see older check-ins and removed friends lose access.

### Extending the catalogue

Add rows to `src/data/seedWines.ts` (name, producer, type, grapes, country, region, store ids). Prices and vintages are deliberately not in the catalogue, since they change; they are recorded per check-in and per cellar entry.

## Known limits

- Wine ratings are summed by the clients, so a determined user could skew an average. Moving that to a Cloud Function would fix it.
- Search runs in the browser over the whole catalogue. Fine up to a few thousand wines; beyond that, add a search service.
- Deleting a check-in removes its moment photos, but bottle photos stay with the wine.
