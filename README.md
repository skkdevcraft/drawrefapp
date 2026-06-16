# DrawRefApp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight web app for **drawing from 3D reference models**. Rotate, pan, and zoom a 3D model while you draw — on desktop or mobile.

> **Available at:** [skkdevcraft.github.io/drawrefapp](https://skkdevcraft.github.io/drawrefapp/)

---

# Demo - side by side on an iPad

https://github.com/user-attachments/assets/b8291e76-5b24-4026-a8be-18fb00686655

---

## Features

- **3D model viewer** — inspect any angle while you sketch
- **URL-driven state** — share your exact camera position, model, and settings
- **Mobile-friendly** — touch controls with large tap targets
- **Event-driven rendering** — zero CPU usage when idle
- **Settings registry** — all configuration lives in one place

---

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview the production build
```

---

## Contributing

Contributions are welcome — whether it's a **new 3D model**, a **feature**, or a **bug fix**.

### Add a model

1. Place your file(s) in `public/models/`
2. Open a pull request

Keep models low-poly and reasonably sized (aim for <5 MB).

### Add a feature

- Read [`docs/000.overview.md`](app/docs/000.overview.md) for the design philosophy
- Read [`docs/002.settings.md`](app/docs/002.settings.md) for the settings registry contract
- Every configurable setting must be registered and URL-serializable
- Keep it simple — no frameworks, no continuous render loops

More in [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## 3D Model Credits

The 3D models in `app/public/models/` are third-party assets with their own
license terms. Full attribution and license info is available in
[`app/src/models/credits.ts`](app/src/models/credits.ts) and in the
in-app settings panel.

---

## License

MIT
