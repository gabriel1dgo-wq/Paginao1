# OLIVER IMOB update — 2026-09-20

Applied the supplied OLIVER IMOB identity: graphite #282F2B, stone #B7B1A7, slate #748995 and ivory #F3F0E9. Updated logo rendition, favicon, page copy, contact copy and WhatsApp introduction. Replaced the previous branded banner with an OLIVER signature. Preserved the nine projects and lead form. The public URL is retained.

The published animation advanced during inspection, but requested scenes while scrolling. The fix prebuffers compressed JPEG frames, decodes only nearby images, sets an explicit image MIME type and falls back to Image.onload when bitmap decoding is unavailable. Frame selection derives from scroll geometry instead of waiting for IntersectionObserver. ResizeObserver and font readiness recalculate layout after content shifts. The existing 4K master is preserved; display frames are 720 × 1280. A native, muted video playback button provides another way to watch the same film. Reduced-motion preference retains manual frame selection.

Verification: 84 browser checks passed using the actual app browser, with desktop and mobile iframe sizes, delayed frame responses and a reduced-motion fixture. Checked progression, reversal, rapid scrolling, manual control, native playback, return to scroll, brand text, project count/order and layout overflow. All 120 JPEGs decode correctly and every static asset is below the hosting limit. Test pages remain outside dist. Mobile coverage is browser viewport testing, not a physical iPhone test.

## Construction follow-up — 2026-09-20

Replaced per-frame loading/decoding with four predecoded JPEG atlases per viewport (60 source frames, blended during scroll). The mobile sequence transfers about 3 MB and holds about 55 MB of decoded pixels; desktop about 4.68 MB and 98 MB. After readiness, scroll rendering performs only synchronous drawImage calls: no fetches or decodes. Loading feedback and native playback remain available. Section styling now uses ivory surfaces, graphite text and slate controls. Restored explicit heading line breaks to prevent concatenated words.

Validation: 92 checks passed in the app browser across desktop, mobile, delayed delivery and reduced-motion fixtures. Each scenario made exactly four atlas requests, and no new image requests during subsequent scrolling. Tested forward/reverse progress, rapid changes, slider, playback and return, overflow, button positions, and computed ivory background. This is browser viewport coverage rather than a physical-device test.
