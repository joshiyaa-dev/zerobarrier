<p align="center">
  <img src="docs/hero.svg" width="100%" alt="ZeroBarrier Animated Hero" />
</p>

<h1 align="center">ZeroBarrier</h1>

<p align="center">
  <strong>AI-Powered Accessibility Scanner for the Web</strong><br/>
  Detects WCAG 2.1 violations, broken keyboard navigation, insufficient contrast, missing ARIA, and cognitive friction — then auto-generates fixes.
</p>

<p align="center">
  <a href="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:00d4ff&text=ZeroBarrier&fontSize=40&fontColor=ffffff&height=120&animation=fadeIn">
    <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:00d4ff&text=ZeroBarrier&fontSize=40&fontColor=ffffff&height=120&animation=fadeIn" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vitest-6E9F17?style=flat-square&logo=vitest&logoColor=white" />
  <img src="https://img.shields.io/badge/WCAG-2.1-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Tests-14%2F14-brightgreen?style=flat-square" />
</p>

---

### The Problem

Over **1 billion** people live with disabilities. Yet **96.3%** of top million homepages have WCAG failures. Automated tools catch ~30% of issues. ZeroBarrier bridges the remaining 70% with AI-powered semantic analysis.

### What It Does

```
  ┌──────────┐     ┌──────────────┐     ┌──────────────┐
  │  Scan a  │────▶│  Analyze DOM │────▶│  AI-Enhanced │
  │  URL     │     │  + a11y tree │     │  Rule Engine │
  └──────────┘     └──────────────┘     └──────┬───────┘
                                                │
                    ┌──────────────┐     ┌──────▼───────┐
                    │  Auto-Fix    │◀────│  Violation    │
                    │  Suggestions │     │  Reports      │
                    └──────────────┘     └──────────────┘
```

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **DOM Crawl** | Parses full page, builds accessibility tree |
| 2 | **WCAG Rules** | 30+ rules covering A, AA, AAA criteria |
| 3 | **Contrast Check** | Calculates luminance ratios with WCAG math |
| 4 | **Keyboard Trap Detection** | Finds focus locks and unreachable elements |
| 5 | **Screen Reader Audit** | Checks `aria-label`, `role`, heading hierarchy |
| 6 | **Auto-Fix Engine** | Generates patched HTML for each violation |
| 7 | **Severity Levels** | Critical / Major / Minor / Info classification |
| 8 | **Remediation Guide** | Human-readable fix instructions per issue |
| 9 | **Export Reports** | JSON and CSV download of scan results |
| 10 | **Visual Overlay** | Highlights violations on the live page |
| 11 | **Heat Map** | Color-coded density of issues per viewport |
| 12 | **Scan History** | Stores past scans in IndexedDB |
| 13 | **Batch Scanning** | Scan multiple URLs in one session |
| 14 | **Score Rating** | 0–100 accessibility score with grade |

### Architecture

```
zero-barrier/
├── src/
│   ├── core/           # Crawler, rule engine, contrast math
│   ├── rules/          # WCAG rule definitions (modular)
│   ├── fixes/          # Auto-fix generators
│   ├── components/     # React UI: Scanner, Report, Overlay
│   └── utils/          # ARIA helpers, color contrast, DOM
├── docs/
│   └── hero.svg        # Animated SVG hero
└── package.json
```

### Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm test           # 14/14 tests pass
npm run build      # production bundle
```

### Data Honesty

| What we store | Where | Retention |
|---------------|-------|-----------|
| Scan results | IndexedDB | Until user clears |
| URLs scanned | Memory only | Session |
| No telemetry | — | — |
| No analytics | — | — |
| No PII | — | — |

### Test Suite

```
 ✓ core/crawler.test.ts      — DOM parsing, a11y tree
 ✓ core/engine.test.ts       — Rule matching, scoring
 ✓ rules/contrast.test.ts    — Luminance math
 ✓ rules/keyboard.test.ts    — Trap detection
 ✓ rules/aria.test.ts        — Missing ARIA audit
 ✓ fixes/autofix.test.ts     — HTML patch generation
 ✓ utils/color.test.ts       — Hex→RGB→Luminance
 ... 7 more test files
 ─────────────────────────────
 14/14 passing (1.2s)
```

### Built by

**[@joshiyaa-dev](https://github.com/joshiyaa-dev)** — Building tools that make the web work for everyone.

---

<p align="center">
  <img src="docs/hero.svg" width="60%" />
</p>
<p align="center">
  <sub>Made with accessibility at the core. Every pixel, every interaction.</sub>
</p>
