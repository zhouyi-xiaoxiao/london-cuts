# generated-images/

Pre-generated postcard-style variants that ship with the repo. Opening the app loads `manifest.json` and seeds every entry into the IDB variant cache, so the London Remembered demo shows finished art on first open — no API calls, no wait.

## To refresh this folder

1. Open the app in a browser. Load the demo and let pre-generation run (or generate variants manually).
2. Click the **📦 Snapshot** button in the bottom-left. This downloads `london-cuts-snapshot.zip`.
3. Extract the zip into this folder (`app/generated-images/`), overwriting existing files.
4. Commit the folder.

Next time the app loads on any machine or browser, the variants are there.

## Format

- `manifest.json` — `{ version, generatedAt, entries: [{ file, sourceIdentity, styleId, styleLabel, quality, prompt, revisedPrompt }] }`
- `<source>__<style-id>.png` — one PNG per variant, keyed to match the IDB cache key `<sourceIdentity>::<styleId>`

Import logic: [app/src/snapshot.jsx](../src/snapshot.jsx).
