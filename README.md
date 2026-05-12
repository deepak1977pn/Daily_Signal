# Daily Signal

A free personal dashboard for daily AI, technology, and current-affairs reading.

## Features

- Daily article list from RSS sources
- AI, tech, current-affairs, and saved filters
- Search
- Read tracking in browser local storage
- Save-for-later tracking
- GitHub Actions workflow to refresh `data/news.json` every day
- Static hosting friendly for GitHub Pages

## Run Locally

Open `index.html` in your browser.

To manually refresh news with Node.js:

```bash
node scripts/fetch-news.mjs
```

## Deploy With GitHub Pages

1. Create a new public GitHub repository.
2. Push this folder to the repository.
3. Open repository `Settings`.
4. Go to `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save.

Your site will be available at:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

## Daily Updates

The workflow in `.github/workflows/daily-news.yml` runs daily at `00:30 UTC`, which is `06:00 IST`.

You can also run it manually:

1. Open the repository on GitHub.
2. Go to `Actions`.
3. Select `Daily news refresh`.
4. Click `Run workflow`.
