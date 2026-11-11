# Breathe API docs

The documentation for the public Breathe API, live at [docs.breatheoss.app](https://docs.breatheoss.app).

It's one static page with no build step, so `index.html`, `style.css` and `main.js` are exactly what gets served. The look follows [about.breatheoss.app](https://about.breatheoss.app), and the tokens at the top of `style.css` are copied from there.

## Editing

Open `index.html` in a browser, or serve the folder with anything static (`npx http-server -c-1 .`). When `style.css` or `main.js` changes, bump the `?v=` on both in `index.html`, because Cloudflare keeps scripts and stylesheets for four hours.

If the API changes, update the matching section here in the same go, along with `llms.txt`.
