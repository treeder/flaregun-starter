import { LitElement, html, css } from 'lit'
import 'material/text/text-field.js'
import 'material/buttons/button.js'
import 'material/buttons/button-group.js'
import 'material/buttons/icon-button.js'
import 'material/buttons/split-button.js'
import 'material/buttons/fab.js'
import 'material/card/card.js'
import 'material/chips/chip-set.js'
import 'material/chips/chip.js'
import 'material/badge/badge.js'
import 'material/dialog/dialog.js'
import 'material/select/select.js'
import 'material/select/select-option.js'
import 'material/tabs/tabs.js'
import 'material/tabs/tab.js'
import 'material/slider/slider.js'
import 'material/switch/switch.js'
import 'material/radio/radio.js'
import 'material/checkbox/checkbox.js'
import 'material/tooltip/tooltip.js'
import 'material/icon/icon.js'
import 'material/menu/menu.js'
import 'material/menu/menu-item.js'
import 'material/indicators/progress.js'
import 'material/indicators/loading.js'
import 'material/carousel/carousel.js'
import 'material/carousel/carousel-item.js'
import 'material/list/list.js'
import 'material/list/list-item.js'
import 'material/search/search.js'
import 'material/divider/divider.js'
import { snack } from 'material/snackbar/snackbar.js'
import { styles } from '/css/styles.js'

export class MaterialDemo extends LitElement {
  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }
      .demo-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;
        margin-bottom: 24px;
        background: var(--md-sys-color-surface-container-low, #f7f2fa);
        border-radius: 20px;
        border: 1px solid var(--md-sys-color-outline-variant, rgba(120, 120, 120, 0.15));
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 4px;
      }
      .section-title {
        font-size: 1.35rem;
        font-weight: 600;
        margin: 0;
        color: var(--md-sys-color-on-surface);
      }
      .section-desc {
        font-size: 0.9rem;
        color: var(--md-sys-color-on-surface-variant);
        margin: 4px 0 0 0;
      }
      .sub-section-title {
        font-size: 1.05rem;
        font-weight: 500;
        margin: 16px 0 4px 0;
        color: var(--md-sys-color-on-surface);
      }
      .flexw {
        display: flex;
        flex-wrap: wrap;
      }
      .component-card {
        width: 310px;
        max-width: 100%;
        background: var(--md-sys-color-surface);
        border-radius: 16px;
        overflow: hidden;
      }
      .card-media-placeholder {
        width: 100%;
        height: 150px;
        background: linear-gradient(135deg, var(--md-sys-color-primary, #6750a4), var(--md-sys-color-tertiary, #7d5260));
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      .tabpanel {
        padding: 16px;
        background: var(--md-sys-color-surface);
        border-radius: 0 0 12px 12px;
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
        border-top: none;
      }
      .banner {
        padding: 20px;
        background: var(--md-sys-color-surface-container, #f3edf7);
        border-radius: 16px;
        margin-bottom: 24px;
        border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }
    `,
  ]

  static properties = {
    activeTab: { type: Number },
    secondaryTab: { type: Number },
    sliderVal: { type: Number },
    rangeStart: { type: Number },
    rangeEnd: { type: Number },
  }

  constructor() {
    super()
    this.activeTab = 0
    this.secondaryTab = 0
    this.sliderVal = 45
    this.rangeStart = 20
    this.rangeEnd = 80
  }

  render() {
    return html`
      <div class="flex col w100">
        <!-- Showcase Banner -->
        <div class="banner">
          <div class="flex jcsb aic flexw g12">
            <div>
              <div class="headline-medium">Material 3 Web Components</div>
              <div class="text-muted mt4">
                Full showcase of pure ESM components from
                <a href="https://github.com/material-esm/material" target="_blank" style="font-weight: 500;">material-esm</a>.
                Always use these components when building features instead of creating custom HTML controls.
              </div>
            </div>
            <a href="https://material-esm.github.io/material/demo/" target="_blank">
              <md-button color="tonal">
                <md-icon slot="icon">open_in_new</md-icon>
                Official Demo
              </md-button>
            </a>
          </div>
        </div>

        <!-- 1. Buttons & Actions -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Buttons & Actions</h2>
              <p class="section-desc">
                Filled, outlined, tonal, elevated, text buttons, sizes, connected groups, split buttons, and FABs.
              </p>
            </div>
          </div>

          <h3 class="sub-section-title">Button Variants</h3>
          <div class="flexw g12 aic">
            <md-button color="filled">
              <md-icon slot="icon">check</md-icon>
              Filled
            </md-button>
            <md-button color="tonal">
              <md-icon slot="icon">favorite</md-icon>
              Tonal
            </md-button>
            <md-button color="elevated">
              <md-icon slot="icon">star</md-icon>
              Elevated
            </md-button>
            <md-button color="outlined">
              <md-icon slot="icon">edit</md-icon>
              Outlined
            </md-button>
            <md-button color="text">Text</md-button>
          </div>

          <h3 class="sub-section-title">Button Sizes & Shapes</h3>
          <div class="flexw g12 aic">
            <md-button size="extra-small">Extra Small</md-button>
            <md-button size="small">Small</md-button>
            <md-button>Default</md-button>
            <md-button size="medium">Medium</md-button>
            <md-button size="large">Large</md-button>
            <md-button shape="square">Square</md-button>
          </div>

          <h3 class="sub-section-title">Connected Button Groups</h3>
          <div class="flexw g16 aic">
            <md-button-group connected checkmark aria-label="Format options">
              <md-button color="tonal" selected>Day</md-button>
              <md-button color="tonal">Week</md-button>
              <md-button color="tonal">Month</md-button>
              <md-button color="tonal">Year</md-button>
            </md-button-group>

            <md-button-group connected aria-label="Alignment">
              <md-button color="outlined"><md-icon slot="icon">format_align_left</md-icon></md-button>
              <md-button color="outlined" selected><md-icon slot="icon">format_align_center</md-icon></md-button>
              <md-button color="outlined"><md-icon slot="icon">format_align_right</md-icon></md-button>
            </md-button-group>
          </div>

          <h3 class="sub-section-title">Split Buttons, FABs & Icon Buttons</h3>
          <div class="flexw g16 aic">
            <md-split-button color="filled" @click=${() => snack('Main action clicked!')}>
              Send
              <div slot="menu">
                <md-menu-item @click=${() => snack('Scheduled send')}>Schedule send</md-menu-item>
                <md-menu-item @click=${() => snack('Draft saved')}>Save draft</md-menu-item>
              </div>
            </md-split-button>

            <md-fab variant="primary" label="New Item" extended>
              <md-icon slot="icon">add</md-icon>
            </md-fab>

            <md-fab variant="secondary" lowered>
              <md-icon slot="icon">edit</md-icon>
            </md-fab>

            <md-icon-button @click=${() => snack('Search clicked')}>
              <md-icon>search</md-icon>
            </md-icon-button>

            <md-icon-button color="tonal">
              <md-icon>share</md-icon>
            </md-icon-button>

            <md-icon-button color="filled">
              <md-icon>thumb_up</md-icon>
            </md-icon-button>
          </div>
        </section>

        <!-- 2. Inputs & Form Controls -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Form Controls & Inputs</h2>
              <p class="section-desc">Text fields, selects, error states, and textareas.</p>
            </div>
          </div>

          <form id="demo-form" class="flex col g16" style="max-width: 480px;" @submit=${(e) => { e.preventDefault(); snack('Form validated successfully!'); }}>
            <md-text-field
              label="Outlined Text Field"
              required
              minlength="3"
              placeholder="Type your name"></md-text-field>

            <md-text-field
              color="filled"
              label="Filled Text Field"
              supporting-text="With supporting text"></md-text-field>

            <md-select label="Select Dropdown" required>
              <md-select-option value="opt1" selected>
                <div slot="headline">First Option</div>
              </md-select-option>
              <md-select-option value="opt2">
                <div slot="headline">Second Option</div>
              </md-select-option>
              <md-select-option value="opt3">
                <div slot="headline">Third Option</div>
              </md-select-option>
            </md-select>

            <md-text-field
              label="Error State Example"
              error
              error-text="This value is invalid"
              value="invalid_entry"></md-text-field>

            <md-text-field
              type="textarea"
              label="Textarea Field"
              rows="3"
              placeholder="Multi-line message here..."></md-text-field>

            <div>
              <md-button type="submit" color="filled">Validate Form</md-button>
            </div>
          </form>
        </section>

        <!-- 3. Selection Controls & Sliders -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Selection Controls & Sliders</h2>
              <p class="section-desc">Switches with icons, checkboxes with indeterminate state, radio buttons, and sliders.</p>
            </div>
          </div>

          <h3 class="sub-section-title">Switches, Checkboxes & Radios</h3>
          <div class="flexw g24 aic">
            <div class="flex aic g12">
              <md-switch selected icons></md-switch>
              <span class="text-muted small">Switch (with icons)</span>
            </div>

            <div class="flex aic g12">
              <md-checkbox checked></md-checkbox>
              <md-checkbox></md-checkbox>
              <md-checkbox indeterminate></md-checkbox>
              <span class="text-muted small">Checkboxes</span>
            </div>

            <div class="flex aic g16">
              <div class="flex aic g8">
                <md-radio id="radio-opt1" name="radio-demo" value="1" checked></md-radio>
                <label for="radio-opt1" style="cursor: pointer;">Option A</label>
              </div>
              <div class="flex aic g8">
                <md-radio id="radio-opt2" name="radio-demo" value="2"></md-radio>
                <label for="radio-opt2" style="cursor: pointer;">Option B</label>
              </div>
            </div>
          </div>

          <h3 class="sub-section-title">Sliders</h3>
          <div class="flex col g16" style="max-width: 500px;">
            <div class="flex col g4">
              <div class="flex jcsb aic">
                <span class="text-muted small">Continuous Labeled Slider</span>
                <span style="font-weight: 500;">${this.sliderVal}</span>
              </div>
              <md-slider
                labeled
                min="0"
                max="100"
                value="${this.sliderVal}"
                @change=${(e) => { this.sliderVal = Number(e.target.value); }}></md-slider>
            </div>

            <div class="flex col g4">
              <span class="text-muted small">Stepped Slider with Ticks</span>
              <md-slider min="0" max="50" step="10" ticks labeled value="30"></md-slider>
            </div>

            <div class="flex col g4">
              <div class="flex jcsb aic">
                <span class="text-muted small">Range Slider</span>
                <span style="font-weight: 500;">${this.rangeStart} - ${this.rangeEnd}</span>
              </div>
              <md-slider
                range
                labeled
                value-start="${this.rangeStart}"
                value-end="${this.rangeEnd}"
                @change=${(e) => {
                  this.rangeStart = Number(e.target.valueStart);
                  this.rangeEnd = Number(e.target.valueEnd);
                }}></md-slider>
            </div>
          </div>
        </section>

        <!-- 4. Tabs & Navigation -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Tabs & Navigation</h2>
              <p class="section-desc">Primary and secondary tab navigation bars with dynamic tabpanels.</p>
            </div>
          </div>

          <div style="max-width: 600px;">
            <md-tabs @change=${(e) => { this.activeTab = e.target.activeTabIndex; }}>
              <md-tab type="primary" aria-label="Overview">
                <md-icon slot="icon">dashboard</md-icon>
                Overview
              </md-tab>
              <md-tab type="primary" aria-label="Analytics">
                <md-icon slot="icon">analytics</md-icon>
                Analytics
              </md-tab>
              <md-tab type="primary" aria-label="Settings">
                <md-icon slot="icon">settings</md-icon>
                Settings
              </md-tab>
            </md-tabs>
            <div class="tabpanel">
              ${this.activeTab === 0
                ? html`<div><strong>Overview Panel:</strong> Quick glance at system metrics and recent activities.</div>`
                : this.activeTab === 1
                  ? html`<div><strong>Analytics Panel:</strong> Detailed charts and telemetry breakdowns.</div>`
                  : html`<div><strong>Settings Panel:</strong> Configure global parameters and notification preferences.</div>`}
            </div>
          </div>
        </section>

        <!-- 5. Feedback, Chips, Badges & Tooltips -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Feedback, Chips, Badges & Dialogs</h2>
              <p class="section-desc">Interactive chips, notification badges, tooltips, dialogs, and snackbars.</p>
            </div>
          </div>

          <h3 class="sub-section-title">Chips & Badges</h3>
          <div class="flex col g12">
            <md-chip-set>
              <md-chip type="assist" label="Assist Chip" @click=${() => snack('Assist chip clicked')}>
                <md-icon slot="icon">help_outline</md-icon>
              </md-chip>
              <md-chip type="filter" label="Filter Chip (Active)" selected></md-chip>
              <md-chip type="filter" label="Filter Chip"></md-chip>
              <md-chip type="input" label="Input Chip" @click=${() => snack('Input chip action')}>
                <md-icon slot="icon">close</md-icon>
              </md-chip>
              <md-chip type="suggestion" label="Suggestion Chip" @click=${() => snack('Suggestion applied')}></md-chip>
            </md-chip-set>

            <div class="flex aic g20 mt4">
              <span style="position: relative; display: inline-flex;">
                <md-icon-button>
                  <md-icon>notifications</md-icon>
                </md-icon-button>
                <md-badge value="4" style="position: absolute; top: 4px; right: 4px;"></md-badge>
              </span>

              <span style="position: relative; display: inline-flex;">
                <md-icon-button>
                  <md-icon>mail</md-icon>
                </md-icon-button>
                <md-badge style="position: absolute; top: 8px; right: 8px;"></md-badge>
              </span>
            </div>
          </div>

          <h3 class="sub-section-title">Tooltips</h3>
          <div class="flexw g16 aic">
            <md-tooltip text="This is a clean, plain Material tooltip">
              <md-button color="outlined">Hover for Plain Tooltip</md-button>
            </md-tooltip>

            <md-tooltip type="rich">
              <md-button color="tonal">Hover for Rich Tooltip</md-button>
              <div slot="headline">Rich Tooltip Headline</div>
              <div slot="text">Provides contextual information with optional interactive actions.</div>
              <div slot="actions" class="flex g8">
                <md-button color="text" size="x-small" @click=${() => snack('Action clicked!')}>Action</md-button>
              </div>
            </md-tooltip>
          </div>

          <h3 class="sub-section-title">Dialog & Snackbar</h3>
          <div class="flexw g16 aic">
            <md-button color="outlined" @click=${() => this.renderRoot.querySelector('#demoDialog').show()}>
              <md-icon slot="icon">open_in_browser</md-icon>
              Open Dialog
            </md-button>

            <md-button
              color="filled"
              @click=${() =>
                snack('Notification message from snackbar!', {
                  action: {
                    label: 'Undo',
                    onClick: () => snack('Undo action triggered!'),
                  },
                  showCloseIcon: true,
                })}>
              <md-icon slot="icon">chat</md-icon>
              Trigger Snackbar
            </md-button>
          </div>

          <md-dialog id="demoDialog">
            <div slot="headline">Material 3 Dialog</div>
            <form slot="content" id="dialog-content-form" method="dialog">
              This is a standard Material 3 modal dialog with slot-based headline, content, and action buttons.
            </form>
            <div slot="actions">
              <md-button color="text" form="dialog-content-form" @click=${() => this.renderRoot.querySelector('#demoDialog').close()}>
                Dismiss
              </md-button>
              <md-button color="filled" form="dialog-content-form" @click=${() => {
                this.renderRoot.querySelector('#demoDialog').close();
                snack('Action confirmed!');
              }}>
                Confirm
              </md-button>
            </div>
          </md-dialog>
        </section>

        <!-- 6. Progress & Loading Indicators -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Progress & Loading Indicators</h2>
              <p class="section-desc">Expressive morphing loading indicators and wavy or flat progress bars.</p>
            </div>
          </div>

          <h3 class="sub-section-title">Loading Indicators</h3>
          <div class="flexw g16 aic">
            <md-loading></md-loading>
            <md-loading contained></md-loading>
            <md-loading color="var(--md-sys-color-tertiary, #7d5260)"></md-loading>
            <md-loading contained size="48"></md-loading>
          </div>

          <h3 class="sub-section-title">Wavy Progress Indicators</h3>
          <div class="flexw g16 aic">
            <md-progress type="circular" indeterminate shape="wavy"></md-progress>
            <md-progress type="circular" value="0.75" shape="wavy"></md-progress>
            <md-progress type="linear" value="0.6" shape="wavy" style="width: 220px;"></md-progress>
            <md-progress type="linear" indeterminate shape="wavy" style="width: 220px;"></md-progress>
          </div>
        </section>

        <!-- 7. Cards, Lists & Surfaces -->
        <section class="demo-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Cards, Lists & Search</h2>
              <p class="section-desc">Outlined, filled, and elevated cards, list items, and search bars.</p>
            </div>
          </div>

          <div class="w100" style="max-width: 480px; margin-bottom: 8px;">
            <md-search placeholder="Search demo items..."></md-search>
          </div>

          <div class="flexw g16">
            <md-card type="outlined" class="component-card">
              <div class="card-media-placeholder">Outlined Card</div>
              <div class="flex col g8 p16">
                <div style="font-weight: 600; font-size: 1.1rem;">Outlined Card</div>
                <div class="text-muted small">Explicit border with clean surface color.</div>
                <div class="flex jce g8 mt8">
                  <md-button color="text">Details</md-button>
                  <md-button color="outlined">Action</md-button>
                </div>
              </div>
            </md-card>

            <md-card type="filled" class="component-card">
              <div class="card-media-placeholder" style="background: linear-gradient(135deg, #006874, #00877a);">Filled Card</div>
              <div class="flex col g8 p16">
                <div style="font-weight: 600; font-size: 1.1rem;">Filled Card</div>
                <div class="text-muted small">Subtle container surface color without outer border.</div>
                <div class="flex jce g8 mt8">
                  <md-button color="text">Details</md-button>
                  <md-button color="tonal">Action</md-button>
                </div>
              </div>
            </md-card>

            <md-card type="elevated" class="component-card">
              <div class="card-media-placeholder" style="background: linear-gradient(135deg, #7c5295, #9c4146);">Elevated Card</div>
              <div class="flex col g8 p16">
                <div style="font-weight: 600; font-size: 1.1rem;">Elevated Card</div>
                <div class="text-muted small">Prominent shadow elevation for hero elements.</div>
                <div class="flex jce g8 mt8">
                  <md-button color="text">Details</md-button>
                  <md-button color="filled">Action</md-button>
                </div>
              </div>
            </md-card>
          </div>

          <h3 class="sub-section-title">List Items</h3>
          <div style="max-width: 500px; background: var(--md-sys-color-surface); border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);">
            <md-list>
              <md-list-item headline="Storage Bucket" supporting-text="Cloudflare R2 Bucket binding ready">
                <md-icon slot="start">cloud_queue</md-icon>
                <md-icon slot="end">chevron_right</md-icon>
              </md-list-item>
              <md-divider></md-divider>
              <md-list-item headline="D1 SQLite Database" supporting-text="Automatic schema migrations & JSON querying">
                <md-icon slot="start">storage</md-icon>
                <md-icon slot="end">chevron_right</md-icon>
              </md-list-item>
              <md-divider></md-divider>
              <md-list-item headline="Passkey Authentication" supporting-text="WebAuthn biometric and security key login">
                <md-icon slot="start">fingerprint</md-icon>
                <md-icon slot="end">chevron_right</md-icon>
              </md-list-item>
            </md-list>
          </div>
        </section>
      </div>
    `
  }
}

customElements.define('material-demo', MaterialDemo)
