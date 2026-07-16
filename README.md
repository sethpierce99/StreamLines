# StreamLines

Interactive potential-flow visualization tool built with Vite, TypeScript, and Canvas 2D.

## Local Development

```powershell
npm install
npm run dev
```

## Static Deployment

The app is configured for GitHub Pages at the repository path:

```text
https://sethpierce99.github.io/StreamLines/
```

Deployment is handled by `.github/workflows/deploy.yml`. In the GitHub repository settings, enable Pages with **Source: GitHub Actions**. Each push to `main` will build the Vite app and publish the `dist` output.
