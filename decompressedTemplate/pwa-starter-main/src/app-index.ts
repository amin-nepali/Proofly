import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

// Web Awesome global styles + theme (replaces the Shoelace theme stylesheets).
import '@awesome.me/webawesome/dist/styles/webawesome.css';
// Point Web Awesome at a hosted copy of its assets (icons, etc.) since the
// components are bundled by Vite and aren't colocated with their assets.
import { setBasePath } from '@awesome.me/webawesome/dist/webawesome.js';
setBasePath('https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.10.0/dist');

import './pages/app-home/app-home';
import './components/header';
import { router } from './router';

import { appIndexStyles } from './app-index.styles';

@customElement('app-index')
export class AppIndex extends LitElement {
  static styles = [appIndexStyles];

  firstUpdated() {
    router.addEventListener('route-changed', () => {
      if ("startViewTransition" in document) {
        document.startViewTransition(() => this.requestUpdate());
      }
      else {
        this.requestUpdate();
      }
    });
  }

  render() {
    // router config can be round in src/router.ts
    return router.render();
  }
}
