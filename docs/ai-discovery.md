# AI Discovery, SEO, and GEO

London Cuts supports both traditional crawl surfaces and AI retrieval surfaces.

## Traditional Search

- `robots.txt` allows public reader pages and API discovery files.
- `sitemap.xml` includes root, atlas, public projects, markdown packs, chapter
  pages, and postcard pages.
- Public project/chapter/postcard pages emit canonical metadata and Open Graph /
  Twitter metadata.
- Public pages emit JSON-LD for `CreativeWork` and stop-level location data.

## AI Retrieval

- `/llms.txt` is the compact AI entry point.
- `/llms-full.txt` includes API/MCP guidance and the public project index.
- `/api/v1/projects/{handle}/{slug}/markdown` gives a clean citation pack so
  agents do not need to scrape styled HTML.
- `/api/openapi.json` describes callable REST endpoints.
- `/mcp` exposes resources, tools, and prompts for MCP-compatible hosts.

## Citation Rules

Use project canonical URLs for project-level claims. Use chapter/postcard URLs
for stop-level claims. Do not cite or disclose studio, auth, invite, sync,
migration, token, or internal admin surfaces.
