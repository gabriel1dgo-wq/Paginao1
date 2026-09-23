# Scroll film correction — 2026-09-14

The previous scroll interaction repeatedly sought a 29.47 MB H.264 MP4. The local Python preview returned HTTP 200 with the entire file for a byte-range request rather than HTTP 206, making that interaction dependent on full buffering and decoder seeking.

The scroll scene now draws 120 WebP frames extracted from the supplied film (12 fps across 10 seconds, 1080 × 1920, 13.49 MB in total). Only the current frame and nearby frames load, with at most three concurrent requests and a bounded decoded-image cache. Scroll reversal reprioritizes the current target. The last valid scene remains visible while another loads. Failed requests offer a retry. Reduced-motion users control the sequence manually. The 4K upscaled MP4 remains available in the assets; it is not loaded by the scroll experience.

Validation:
- All 120 WebP files decoded and all local HTML asset references resolved.
- 51 browser checks passed in the Codex in-app Chromium browser, with 1440 × 1000 and 390 × 844 iframe viewports and 450 ms added latency per frame for the slow-loading scenario. Checked forward/reverse scroll, rapid direction changes, manual scrub, actual canvas image differences, horizontal overflow, CTA/control overlap, project order and absence of MP4 requests. No browser errors were reported. Mobile coverage is a narrow browser viewport, not a physical iPhone/Safari test.
- Six additional controller/real-image-decoder test scenarios passed: desktop, mobile, delayed responses, reduced motion, failed frame plus retry, and data saver. Checks include bounded request concurrency/cache, offscreen/background inactivity and cleanup. Those tests simulate DOM events and do not replace browser layout checks.
- Local correction only; no deployment in this turn.

Test artifacts are retained in the workspace work directory: scroll-browser-report.json, scroll-logic-test-results.json, scroll-qa.html, scroll-qa-server.py and test-scroll-sequence.cjs. The browser test harness is outside the public output.
