import { css } from 'rend'

export function landingStyles() {
  return css`
    :root {
      color-scheme: light dark;
      --in-oklab: ;
    }

    @supports (background: linear-gradient(in oklab, white, black)) {
      :root {
        --in-oklab: in oklab;
      }
    }

    /* Sticky glassmorphic top navigation aligned to page container */
    .topnav {
      position: sticky;
      inset-block-start: 0;
      z-index: 40;
      background: color-mix(in oklab, var(--md-sys-color-background, #f8f9fa) 84%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-block-end: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant, #c2c7ce) 60%, transparent);
      margin-block-end: 0;
    }

    .topnav-inner {
      max-inline-size: 1160px;
      margin-inline: auto;
      inline-size: 100%;
      display: flex;
      align-items: safe center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px 20px;
    }

    .brand-link {
      display: inline-flex;
      align-items: safe center;
      gap: 10px;
      text-decoration: none;
      color: var(--md-sys-color-on-surface);
    }

    .brand-logo {
      display: block;
      inline-size: 36px;
      block-size: 38px;
      aspect-ratio: 38 / 40;
      filter: drop-shadow(0 2px 6px rgba(98, 0, 234, 0.22));
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--md-sys-color-on-surface);
    }

    /* Landing page shell */
    .landing-shell {
      max-inline-size: 1160px;
      margin-inline: auto;
      padding-block: clamp(16px, 2.5vw, 28px) 24px;
      padding-inline: clamp(16px, 3vw, 24px);
      display: flex;
      flex-direction: column;
      gap: clamp(36px, 5vw, 60px);
      box-sizing: border-box;
    }

    /* Atmospheric Hero Stage */
    .hero-stage {
      position: relative;
      isolation: isolate;
      overflow: clip;
      border-radius: 28px;
      padding-block: clamp(28px, 4.5vw, 52px);
      padding-inline: clamp(20px, 4vw, 48px);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-primary) 20%, var(--md-sys-color-outline-variant));
      background:
        radial-gradient(
          circle at 12% 10% var(--in-oklab),
          color-mix(in oklab, var(--md-sys-color-primary) 15%, transparent) 0%,
          transparent 52%
        ),
        radial-gradient(
          circle at 90% 18% var(--in-oklab),
          color-mix(in oklab, var(--md-sys-color-tertiary) 14%, transparent) 0%,
          transparent 48%
        ),
        radial-gradient(
          circle at 75% 92% var(--in-oklab),
          color-mix(in oklab, var(--md-sys-color-secondary) 14%, transparent) 0%,
          transparent 55%
        ),
        linear-gradient(
          160deg var(--in-oklab),
          var(--md-sys-color-surface, #ffffff) 0%,
          var(--md-sys-color-surface-container-low, #f1f4f9) 100%
        );
      box-shadow:
        0 20px 44px -20px color-mix(in oklab, var(--md-sys-color-primary) 18%, transparent),
        0 2px 10px -2px rgba(0, 0, 0, 0.05);
    }

    /* Subtle architectural dot matrix pattern via CSS gradients */
    .hero-stage::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      --dot-color: color-mix(in oklab, var(--md-sys-color-on-surface) 8%, transparent);
      background-image: radial-gradient(circle, var(--dot-color) 1px, transparent 1.5px);
      background-size: 22px 22px;
      mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.15));
    }

    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.98fr);
      align-items: center;
      gap: clamp(28px, 4vw, 44px);
    }

    @media (width < 960px) {
      .hero-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      min-inline-size: 0;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: safe center;
      flex-wrap: wrap;
      gap: 8px;
      padding-block: 6px;
      padding-inline: 14px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--md-sys-color-secondary-container) 82%, var(--md-sys-color-surface));
      color: var(--md-sys-color-on-secondary-container);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-primary) 22%, transparent);
      font-size: 0.88rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .hero-eyebrow md-icon {
      font-size: 18px;
      color: var(--md-sys-color-primary);
    }

    .hero-eyebrow-sep {
      opacity: 0.45;
    }

    .hero-eyebrow-tag {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--md-sys-color-primary);
    }

    .hero-title {
      margin: 0;
      font-size: clamp(2.15rem, 1.4rem + 2.5vw, 3.4rem);
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--md-sys-color-on-surface);
      text-wrap: balance;
      max-inline-size: 18ch;
    }

    .hero-lead {
      margin: 0;
      font-size: clamp(1.02rem, 0.95rem + 0.3vw, 1.16rem);
      line-height: 1.62;
      color: var(--md-sys-color-on-surface-variant);
      text-wrap: pretty;
      max-inline-size: 56ch;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      align-items: safe center;
      gap: 12px;
      padding-block-start: 4px;
    }

    .hero-metrics {
      margin: 4px 0 0;
      padding: 16px 0 0;
      inline-size: 100%;
      border-block-start: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 65%, transparent);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
      gap: 14px 18px;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-inline-size: 0;
    }

    .metric-item dt {
      font-size: 0.76rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      order: 2;
    }

    .metric-item dd {
      margin: 0;
      font-size: 1.08rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--md-sys-color-on-surface);
      order: 1;
    }

    .hero-visual {
      min-inline-size: 0;
      inline-size: 100%;
    }

    /* Section Headers */
    .section-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px 24px;
    }

    .section-head-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-inline-size: 0;
    }

    .section-kicker {
      display: inline-flex;
      align-items: safe center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--md-sys-color-primary);
    }

    .section-kicker md-icon {
      font-size: 16px;
    }

    .section-heading {
      margin: 0;
      font-size: clamp(1.55rem, 1.25rem + 1vw, 2.05rem);
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--md-sys-color-on-surface);
      text-wrap: balance;
    }

    .section-subtitle {
      margin: 0;
      font-size: 1.02rem;
      line-height: 1.55;
      color: var(--md-sys-color-on-surface-variant);
      text-wrap: pretty;
      max-inline-size: 62ch;
    }

    /* Bento Architecture Grid */
    .bento-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .bento-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 18px;
    }

    .bento-card {
      container-type: inline-size;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      padding: 24px;
      border-radius: 22px;
      background: var(--md-card-container-color, var(--md-sys-color-surface, #ffffff));
      border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 78%, transparent);
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.04);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        translate 0.2s ease;
    }

    .bento-card:hover {
      border-color: color-mix(in oklab, var(--md-sys-color-primary) 42%, var(--md-sys-color-outline-variant));
      box-shadow: 0 14px 30px -14px color-mix(in oklab, var(--md-sys-color-primary) 22%, transparent);
    }

    @media (prefers-reduced-motion: no-preference) {
      .bento-card:hover {
        translate: 0 -2px;
      }
    }

    .bento-span-7 {
      grid-column: span 7;
      background: linear-gradient(
        145deg var(--in-oklab),
        var(--md-card-container-color, var(--md-sys-color-surface)) 55%,
        color-mix(in oklab, var(--md-sys-color-primary-container) 34%, var(--md-sys-color-surface)) 100%
      );
    }

    .bento-span-5 {
      grid-column: span 5;
      background: linear-gradient(
        145deg var(--in-oklab),
        var(--md-card-container-color, var(--md-sys-color-surface)) 55%,
        color-mix(in oklab, var(--md-sys-color-secondary-container) 42%, var(--md-sys-color-surface)) 100%
      );
    }

    .bento-span-4 {
      grid-column: span 4;
    }

    @media (width < 960px) {
      .bento-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .bento-span-7,
      .bento-span-5,
      .bento-span-4 {
        grid-column: span 1;
      }
      .bento-card:last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }
    }

    @media (width < 640px) {
      .bento-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .bento-card:last-child:nth-child(odd) {
        grid-column: span 1;
      }
    }

    .bento-top {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-inline-size: 0;
    }

    .bento-icon-row {
      display: flex;
      align-items: safe center;
      justify-content: space-between;
      gap: 12px;
    }

    .bento-icon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 44px;
      block-size: 44px;
      border-radius: 14px;
      background: color-mix(in oklab, var(--md-sys-color-primary) 13%, var(--md-sys-color-surface));
      color: var(--md-sys-color-primary);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-primary) 22%, transparent);
      flex-shrink: 0;
    }

    .bento-icon-badge.tone-tertiary {
      background: color-mix(in oklab, var(--md-sys-color-tertiary) 14%, var(--md-sys-color-surface));
      color: var(--md-sys-color-tertiary);
      border-color: color-mix(in oklab, var(--md-sys-color-tertiary) 24%, transparent);
    }

    .bento-icon-badge.tone-secondary {
      background: color-mix(in oklab, var(--md-sys-color-secondary) 16%, var(--md-sys-color-surface));
      color: var(--md-sys-color-secondary);
      border-color: color-mix(in oklab, var(--md-sys-color-secondary) 26%, transparent);
    }

    .bento-tag {
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding-block: 4px;
      padding-inline: 10px;
      border-radius: 999px;
      background: var(--md-sys-color-surface-container, rgba(0, 0, 0, 0.05));
      color: var(--md-sys-color-on-surface-variant);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 65%, transparent);
    }

    .bento-title {
      margin: 0;
      font-size: 1.2rem;
      line-height: 1.3;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--md-sys-color-on-surface);
    }

    .bento-desc {
      margin: 0;
      font-size: 0.96rem;
      line-height: 1.58;
      color: var(--md-sys-color-on-surface-variant);
      text-wrap: pretty;
    }

    .bento-desc code {
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
      font-size: 0.85em;
      padding-block: 1px;
      padding-inline: 6px;
      border-radius: 6px;
      background: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.06));
      color: var(--md-sys-color-on-surface);
    }

    .bento-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: safe center;
      justify-content: space-between;
      gap: 10px;
      padding-block-start: 12px;
      border-block-start: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 50%, transparent);
    }

    .bento-chips {
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      gap: 6px;
    }

    .mini-pill {
      font-size: 0.76rem;
      font-weight: 600;
      padding-block: 3px;
      padding-inline: 9px;
      border-radius: 8px;
      background: color-mix(in oklab, var(--md-sys-color-surface-container-high) 80%, transparent);
      color: var(--md-sys-color-on-surface-variant);
    }

    .bento-link {
      display: inline-flex;
      align-items: safe center;
      gap: 4px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }

    .bento-link:hover,
    .bento-link:focus-visible {
      text-decoration: underline;
    }

    .bento-link md-icon {
      font-size: 17px;
    }

    /* Live Marketplace Showcase Section */
    .marketplace-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: clamp(20px, 3vw, 32px);
      border-radius: 26px;
      background: var(--md-sys-color-surface-container-low, #f1f4f9);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 72%, transparent);
    }

    .live-stack-pills {
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      align-items: safe center;
      gap: 8px;
    }

    .stack-chip {
      display: inline-flex;
      align-items: safe center;
      gap: 5px;
      font-size: 0.78rem;
      font-weight: 600;
      padding-block: 4px;
      padding-inline: 10px;
      border-radius: 999px;
      background: var(--md-sys-color-surface, #ffffff);
      color: var(--md-sys-color-on-surface-variant);
      border: 1px solid color-mix(in oklab, var(--md-sys-color-outline-variant) 70%, transparent);
    }

    .stack-chip md-icon {
      font-size: 15px;
      color: var(--md-sys-color-primary);
    }

    /* Bottom Launchpad Callout */
    .cta-launchpad {
      display: flex;
      flex-wrap: wrap;
      align-items: safe center;
      justify-content: space-between;
      gap: 20px 32px;
      padding: clamp(24px, 3.5vw, 36px);
      border-radius: 24px;
      background: linear-gradient(
        135deg var(--in-oklab),
        color-mix(in oklab, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface)) 0%,
        color-mix(in oklab, var(--md-sys-color-secondary-container) 65%, var(--md-sys-color-surface)) 100%
      );
      border: 1px solid color-mix(in oklab, var(--md-sys-color-primary) 24%, var(--md-sys-color-outline-variant));
    }

    .cta-launchpad-copy {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-inline-size: 0;
      max-inline-size: 56ch;
    }

    .cta-launchpad-title {
      margin: 0;
      font-size: clamp(1.35rem, 1.15rem + 0.8vw, 1.75rem);
      line-height: 1.25;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--md-sys-color-on-surface);
      text-wrap: balance;
    }

    .cta-launchpad-desc {
      margin: 0;
      font-size: 0.98rem;
      line-height: 1.55;
      color: var(--md-sys-color-on-surface-variant);
      text-wrap: pretty;
    }

    .cta-launchpad-actions {
      display: flex;
      flex-wrap: wrap;
      flex-wrap: balance;
      align-items: safe center;
      gap: 12px;
    }

    @media (forced-colors: active) {
      .hero-stage,
      .bento-card,
      .marketplace-section,
      .cta-launchpad {
        border: 1px solid CanvasText;
      }
    }
  `
}
