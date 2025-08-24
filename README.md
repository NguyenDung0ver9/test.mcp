# My MCP Demo Repo

This repository is created for testing a **remote MCP server with GitHub**.
It includes sample code, documentation, and a small web app to test the following tools:

- `fetch_generic_url_content`
- `search_code`
- `search_docs`
- `fetch_docs`

## Contents
- web/ → A small static website (HTML, CSS, JS)
- src/ → Python demo code
- docs/ → Markdown docs for searching & fetching
- urls.txt → Example URLs to test fetch_generic_url_content

## Usage
1. Unzip the archive.
2. Inspect files or open `web/index.html` in a browser.
3. Use the MCP tools to search/fetch:
   - Search code: look for `hello_world` in `src/demo.py`
   - Search docs: keywords like `Installation` in `docs/guide.md`
   - Fetch docs: `docs/faq.md`
   - Fetch generic URL: entries in `urls.txt`

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for MCP demo"
git branch -M main
git remote add origin https://github.com/<your-username>/my-mcp-demo.git
git push -u origin main
```

