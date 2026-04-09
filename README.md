# ID Project Estimator

A personal tool for scoping and estimating freelance instructional design projects (Rise 360 / Storyline 360). Generates hour estimates, cost totals, and timeline projections from a structured intake form. Saves estimates locally and supports copy/print export.

## Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev
# Opens at http://localhost:5173/id-estimator/
```

## Deploy to GitHub Pages

### First time

1. Create a new GitHub repo named `id-estimator`

2. In `package.json`, replace the homepage with your username:
   `"homepage": "https://YOUR_USERNAME.github.io/id-estimator"`

3. Connect and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/id-estimator.git
   git push -u origin main
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. In GitHub repo Settings → Pages, set source to the `gh-pages` branch. Live at:
   `https://YOUR_USERNAME.github.io/id-estimator/`

### Subsequent deploys

```bash
git add . && git commit -m "your change" && git push
npm run deploy
```

## Notes

- Estimates persist in `localStorage` — survives refreshes, browser-specific.
- "Export / Print" opens a formatted plain-text view for printing or saving as PDF.
- Hours-per-unit fields (amber) are editable per estimate.
