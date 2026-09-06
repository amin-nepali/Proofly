import { LitElement, css, html, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@awesome.me/webawesome/dist/components/button/button.js';
@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: String }) title = 'PWA Starter';

  @property({ type: Boolean}) enableBack: boolean = false;

  static styles = css`
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      background: var(--app-color-primary);
      color: var(--app-color-on-primary);
      padding: 0 16px;

      position: fixed;
      left: env(titlebar-area-x, 0);
      top: env(titlebar-area-y, 0);
      height: env(titlebar-area-height, 56px);
      width: env(titlebar-area-width, 100%);
      -webkit-app-region: drag;
    }

    header h1 {
      margin-top: 0;
      margin-bottom: 0;
      font-size: 16px;
      font-weight: bold;
    }

    nav {
      display: flex;
      align-items: center;
      gap: 16px;
      -webkit-app-region: no-drag;
    }

    nav a {
      color: var(--app-color-on-primary);
      text-decoration: none;
      font-size: 15px;
      opacity: 0.8;
    }

    nav a:hover {
      opacity: 1;
    }

    nav a[aria-current='page'] {
      opacity: 1;
      font-weight: bold;
      text-decoration: underline;
    }

    #back-button-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
  `;

  render() {
    const homePath = resolveRouterPath();
    const aboutPath = resolveRouterPath('about');
    const current = window.location.pathname;
    return html`
      <header>

        <div id="back-button-block">
          ${this.enableBack ? html`<wa-button size="s" href="${homePath}">
            Back
          </wa-button>` : null}

          <h1>${this.title}</h1>
        </div>

        <nav>
          <a
            href="${homePath}"
            aria-current="${current === homePath ? 'page' : nothing}"
            >Home</a
          >
          <a
            href="${aboutPath}"
            aria-current="${current === aboutPath ? 'page' : nothing}"
            >About</a
          >
        </nav>
      </header>
    `;
  }
}
