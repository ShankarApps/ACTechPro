# AC Tech Pro

Offline-first PWA: air conditioner error code lookup for technicians.
Built entirely on a phone with Termux + GitHub Pages.

## Files
- `index.html` — layout (Tailwind via CDN)
- `style.css` — custom styles (big thumb-friendly buttons)
- `app.js` — search, brand filter, detail view, offline badge, SW registration
- `data.json` — error code database (edit this to add codes!)
- `service-worker.js` — offline caching
- `manifest.json` + icons — required for PWA / Play Store wrapping

## Setup in Termux

```bash
pkg update && pkg install git -y
mkdir ACTechPro && cd ACTechPro
# paste/create all files here, then:
git init
git add .
git commit -m "Initial commit"
# create an empty repo named ACTechPro on github.com (in your phone browser),
# then link and push:
git remote add origin https://github.com/YOUR_USERNAME/ACTechPro.git
git branch -M main
git push -u origin main
```

## Enable GitHub Pages
Repo page -> Settings -> Pages -> Source: "Deploy from a branch" -> Branch: main, /(root) -> Save.
Your app goes live at: https://YOUR_USERNAME.github.io/ACTechPro/

## Update the database (add new codes)
Edit `data.json`, keep the exact format:
[{"brand": "Voltas", "code": "E5", "meaning": "...", "check": "..."}]
Then:

```bash
git add data.json
git commit -m "Add new codes"
git push
```

## Wrap into APK for Play Store
1. Open https://www.pwabuilder.com on your phone
2. Enter your live URL -> Package for Android -> download the AAB/APK
3. Create a signing key (needs a JDK; you can generate one on GitHub Actions
   or in Termux via `pkg install openjdk-17` in the tur repo, then:
   `keytool -genkey -v -keystore mykey.jks -keyalg RSA -keysize 2048 -validity 10000 -alias actech`)
4. Upload the AAB to Google Play Console ($25 one-time developer account)
5. For real AdMob ads inside the APK, wrap with Capacitor instead and use the
   AdMob plugin — AdSense covers the web version, AdMob covers the native app.
