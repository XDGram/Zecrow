# Zecrow handoff

## Current milestone: homepage visual foundation

### Product context
Zecrow is a managed private escrow service for real-world commerce using shielded Zcash payments. Custody is service-managed and the service enforces the escrow state machine. Do not describe the MVP as trustless or claim Orchard is a smart contract. Buyer checkout should not require an account. Merchant onboarding is planned to support Google sign-in and a compatible Zcash wallet connection, with real wallet compatibility validated separately.

### Completed in this milestone
- Initialized the previously empty `XDGram/Zecrow` repository as a Vite + React + TypeScript app.
- Added the Rixor motion-ribbon background video and poster, adapted for Zecrow's warm off-white canvas.
- Added the navbar only: Zecrow mark/wordmark, compact segmented navigation, Sign in, and Get started actions.
- Applied the Rixor palette: `#F4F6EF` canvas, `#C6F24E` lime, `#16281B` dark green, `#E9F7C9` soft lime.
- Kept the main homepage canvas otherwise empty by design, per the requested scope. No hero copy, signup flow, checkout, or backend was added.
- Added responsive layout and reduced-motion handling.

### Files
- `src/App.tsx`: background video and navbar markup.
- `src/styles.css`: palette, video placement/blend, navbar styling, responsive rules.
- `src/main.tsx`: React entry point.
- `public/video/zecrow-ribbon-motion.webm`: copied from the existing Rixor motion-alpha video.
- `public/images/zecrow-ribbon-poster.webp`: copied from the existing Rixor poster.
- `index.html`: page title and metadata.

### Verification
- `npm install` completed with 0 reported vulnerabilities. `npm run build` passes (TypeScript + Vite production build).
- Dev server starts at `http://127.0.0.1:5173/`. Visual screenshot capture was attempted but not confirmed, so browser-level visual review remains pending.
- Check the header anchors before implementing their real destinations.

### Important constraints
- This milestone is visual only. Do not interpret the placeholder anchors as implemented routes/auth.
- Preserve the frozen managed-custody disclosure in future checkout/payment pages.
- Do not introduce wallet or Google auth until the integration is actually implemented and tested.
- Do not add hero content until the user asks for the next homepage section.

### Next step
Review the visual result. Once approved, implement the homepage content below this header without changing the background or navbar unless requested.
