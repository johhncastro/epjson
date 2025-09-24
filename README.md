# Beautiful JSON

A privacy-first JSON utility that runs entirely in your browser. No external APIs, no telemetry, and no network calls.

## Features

- **Beautify/Minify**: Format JSON with customizable indentation
- **Validate**: Real-time validation with error reporting
- **Tree View**: Collapsible, hierarchical display
- **Diff View**: Compare two JSON documents
- **JSONPath Queries**: Extract specific data with `$.path.to.data[0]`
- **Large File Support**: Handles files up to 50MB with Web Workers

## Quick Start

1. **Download** all files to your web server
2. **Access** via browser (e.g., `http://localhost:8000`)
3. **Use** - paste JSON, choose operation, view results

### Local Development
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

## Keyboard Shortcuts

- `Ctrl/Cmd + B`: Beautify JSON
- `Ctrl/Cmd + M`: Minify JSON  
- `Ctrl/Cmd + Enter`: Validate JSON
- `Ctrl/Cmd + D`: Switch to Diff view

## Privacy

- 100% local processing
- No data leaves your browser
- No external dependencies
- No tracking or analytics

---

**License**: Public Domain
# epjson
