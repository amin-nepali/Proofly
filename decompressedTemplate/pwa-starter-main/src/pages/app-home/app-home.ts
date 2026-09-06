import { LitElement, html } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';

import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

// You can also import styles from another file
// if you prefer to keep your CSS seperate from your component
import { homeStyles } from './app-home.styles';

import { styles as sharedStyles } from '../../shared.styles';

@customElement('app-home')
export class AppHome extends LitElement {

  // For more information on using properties and state in lit
  // check out this link https://lit.dev/docs/components/properties/
  @property() message = 'Welcome!';
  @state() counter = 0;

  static styles = [
    sharedStyles,
    homeStyles
  ];

  share() {
      navigator.share({
        title: 'PWABuilder pwa-starter',
        text: 'Check out the PWABuilder pwa-starter!',
        url: 'https://github.com/pwa-builder/pwa-starter',
      });
  }

  render() {
    return html`
      <app-header></app-header>

      <main>
        <div id="welcomeBar">
          <wa-card id="welcomeCard">
            <div slot="header">
              <h2>${this.message}</h2>
            </div>

            <p>
              For more information on the PWABuilder pwa-starter, check out the
              <a href="https://docs.pwabuilder.com/#/starter/quick-start">
                documentation</a>.
            </p>

            <p id="mainInfo">
              Welcome to the
              <a href="https://pwabuilder.com">PWABuilder</a>
              pwa-starter! Be sure to head back to
              <a href="https://pwabuilder.com">PWABuilder</a>
              when you are ready to ship this PWA to the Microsoft Store, Google Play
              and the Apple App Store!
            </p>

            <wa-button @click="${this.increment}">
              Increment: ${this.counter}
            </wa-button>
          </wa-card>

          <wa-card id="infoCard">
            <h2>PWA Starter</h2>
            <p>PWABuilder's pwa-starter is our opinionated, best practices, production tested starter that we use to build all of our PWAs, including PWABuilder itself! The pwa-starter is a starter codebase, just like create-react-app or the Angular CLI can generate, that uses the PWABuilder team's preferred front-end tech stack. We also have a CLI tool to allow you to create a PWA template from the command line.</p>
            <p>We use these lightweight technologies:</p>
            <ul>
              <li>
                <a href="https://lit.dev">Lit</a> - Simple, fast, lightweight <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_components">web components</a>.
              </li>

              <li>
                <a href="https://webawesome.com/">Web Awesome</a> - A library of web components built atop Lit.
              </li>

              <li>
                <a href="https://developer.chrome.com/docs/workbox/">Workbox</a> - Production-ready service workers.
              </li>
            </ul>
          </wa-card>
        </div>
      </main>
    `;
  }

  increment() {
    this.counter++;
  }
}
