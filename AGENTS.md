# Repository Guidelines

## Project Structure & Module Organization
- `index.html` defines the full layout and bootstraps assets; treat it as the single entry point.
- `css/style.css` holds all visual styling; organize new rules near related sections and reuse existing CSS variables.
- `js/main.js` contains the navigation logic (config loading, search, theming). Group added functions by feature and keep them pure when possible.
- `config.json` defines global settings and available navigation configurations.
- `default.json` and `project.json` contain the actual categories and sites for each navigation mode.
- Keep images in `img/` and favicons alongside to leverage the existing loading helpers.

## Build, Test, and Development Commands
- `python3 -m http.server 8000` serves the site locally from the project root using the standard library HTTP server.
- `open http://localhost:8000` (macOS) or your browser of choice verifies the running instance.
- When iterating, refresh after editing any JSON config file; the fetch call re-reads the file on each page load.

## Coding Style & Naming Conventions
- Use four-space indentation in HTML, CSS, and JavaScript to match the current codebase.
- Prefer `const`/`let`, template literals, and explicit semicolons in JavaScript; keep helper names descriptive (e.g., `initSearch`).
- CSS class names follow a descriptive, lowercase-with-hyphen style (`.menu-item`, `.site-card`).
- Phosphor icon names map to `ph-<icon>` classes; keep them lowercase to avoid missing glyphs.

## Testing Guidelines
- There is no automated suite; validate changes manually in Chromium- and WebKit-based browsers.
- Confirm config-driven features: category rendering, search filtering, theme toggle persistence, and visit counters.
- Use browser dev tools to watch for failed JSON fetches or console errors before submitting.

## Commit & Pull Request Guidelines
- Existing history favors short summaries (e.g., `update`, `添加官网地址`); keep messages succinct but add context (`feat: add security links`).
- Explain user-visible changes in the body when necessary and link issues or tasks using `Refs: <ticket>`.
- Pull requests should outline the motivation, list key changes, and include screenshots or screen recordings for UI tweaks.

## Configuration Tips
- Add sites by extending `categories[].sites` in `default.json` or `project.json`; set `useFavicon: false` and an `icon` to force a Phosphor glyph.
- Keep URLs absolute and include brief descriptions so the search helper surfaces entries effectively.
