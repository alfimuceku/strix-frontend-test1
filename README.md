# STRIX — Beyond the Market

Marketing site for Strix Options. The homepage is a scroll-driven, real-time WebGL2 journey through five scenes; the interior pages cover plans, rules, payouts, FAQ, contact, sign-in and checkout.

Built with Next.js (App Router), React and TypeScript. The 3D renderer has no external dependencies.

## Getting started

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript check
```

## Project structure

```
app/                     routes, root layout, metadata, sitemap, robots, social images
app/globals.css          design tokens, homepage and shared component styles
app/interior.css         interior-page visuals, tables, hover effects, scroll-in reveals
src/views/               page bodies: Plans, Rules, Payouts, FAQ, Contact, Start, SignIn, Legal
src/components/home/     homepage: Stage (canvas + fallback), chapters, journey rail, terminal handover
src/components/terminal/ interactive dashboard panels (payoff lab, drawdown monitor, chain, payouts)
src/components/layout/   header, footer, route transitions, mobile start bar
src/components/motion/   scroll reveal, in-view hook, segmented control, legal table of contents
src/components/…         plans, rules, payouts, faq, contact, shared UI
src/gl/                  WebGL2 renderer, shaders, camera paths, interior hero cameras
src/lib/                 content, config, product data, options math, scroll/story controller
public/stills/           pre-rendered monument frames shown before the canvas is ready
```

## Editing content

| What | Where |
|---|---|
| Page wording (headings, body copy, labels) | `src/lib/copy.ts` |
| Product data: prices, targets, drawdowns, fees, payout caps, rules, FAQ, contact details, disclaimers | `src/lib/data.ts` |
| Site URL, navigation, payment/sign-in handoff URLs, running promotion | `src/lib/config.ts` |

Every table, calculator and dashboard panel reads from `data.ts`, so a change there updates the whole site. Market data shown in the terminal is illustrative and labelled as such.

`PROMO` in `config.ts` controls the struck-through prices, the promo strip, the FAQ wording and the checkout discount. Set `active: false` to show list prices only.

## How the homepage works

- **Scroll mapping** (`src/lib/story.ts`): each chapter `<section>` carries `data-t0`/`data-t1`. Its scroll progress maps onto "story time" T (0–5), which the camera follows with critically damped smoothing. Native scrolling is never hijacked. Text beats (`data-beat="a,b"`) show within a progress window; inactive beats are made `inert`.
- **Camera** (`src/gl/camera.ts`): Catmull-Rom keyframes per world, with separate paths for desktop and portrait screens, plus scene state (engine assembly, iris, dimming, horizon) as functions of T.
- **Scene** (`src/gl/shaders/scene.ts`): a single raymarched signed-distance field. The X's aperture is a portal: rays that cross it continue in a second coordinate space.
- **Market → engine transition** (`src/gl/stream.ts`): column poses computed on the CPU and traced analytically in the shader.
- **Terminal handover** (`src/gl/panels.ts`, `src/components/home/terminalHandover.ts`): 3D glass frames settle over the HTML dashboard panels, then crossfade into them.
- **Renderer** (`src/gl/StrixRenderer.ts`): scene → bright pass → blur → composite. Internal resolution adapts to frame time; context loss is handled.
- **First paint**: `public/stills/monument-{desktop,mobile}.jpg` sit behind the canvas until the first frame is drawn. Re-render them if the monument or its opening camera changes.

Interior pages use `WorldHero`, which renders one moment of the journey with its own camera from `src/gl/heroCameras.ts`.

## Accessibility and fallbacks

- Without WebGL2 (or after a lost context) each scene falls back to a CSS poster. All content stays in the DOM in reading order.
- With `prefers-reduced-motion`, the homepage shows one still per world and all animations are disabled.
- Without JavaScript, the homepage chapters render as a normal long-form page and interior content is fully visible.
- All controls are real buttons or radio groups with keyboard support; charts have a range input alongside hover.

## Deployment

The site is a standard Next.js app with no environment variables. Deploy it to any host that supports Next.js (for example Vercel), or run `npm run build && npm run start` on a Node.js 20.9+ server.

Before going live:

- Set `SITE_URL` in `src/lib/config.ts`; it is used for metadata, the sitemap and robots.txt.
- Point `PAYMENT_HANDOFF_URL`, `AUTH_HANDOFF_URL` and `AFFILIATES_URL` in `config.ts` at production. `/start` and `/sign-in` validate their forms and then hand over to these URLs; replace the submit handlers in `src/views/StartView.tsx` and `src/views/SignInView.tsx` when direct APIs are available.
- The contact form opens the visitor's mail client. Replace `onSubmit` in `src/components/contact/ContactForm.tsx` with a support endpoint when one exists.
- "See the whitelist" links to the Rules page; point it at the published list when there is one.
