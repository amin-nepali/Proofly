// A lightweight client-side router built on the web platform Navigation API.
// See https://developer.chrome.com/docs/web-platform/navigation-api/ for details.

import { html, nothing, type TemplateResult } from 'lit';

// URLPattern is used for route matching. Load the polyfill when the browser
// doesn't ship it natively (e.g. older Safari/Firefox).
if (!(globalThis as any).URLPattern) {
  await import('urlpattern-polyfill');
}

const URLPatternCtor: any = (globalThis as any).URLPattern;

export interface Route {
  /** Fully-resolved pathname to match (see resolveRouterPath). */
  path: string;
  /** Optional document title applied when the route becomes active. */
  title?: string;
  /** Renders the route's view. */
  render: () => TemplateResult;
  /** Optional lazy loader run before the first render of the route. */
  load?: () => Promise<unknown>;
}

export interface RouterConfig {
  routes: Route[];
  /** Rendered when no route matches. */
  fallback?: Route;
}

const baseURL: string = (import.meta as any).env.BASE_URL;

export class Router extends EventTarget {
  readonly routes: Route[];
  private readonly fallback?: Route;
  private content: TemplateResult | typeof nothing = nothing;

  constructor(config: RouterConfig) {
    super();
    this.routes = config.routes;
    this.fallback = config.fallback;

    const navigation = (window as any).navigation;
    if (navigation) {
      navigation.addEventListener('navigate', (event: any) =>
        this.onNavigate(event)
      );
    }

    // The Navigation API does not emit a "navigate" event for the initial
    // document load, so resolve the current route right away.
    const url = new URL(window.location.href);
    const route = this.match(url);
    if (route?.load) {
      void this.activate(route);
    } else if (route) {
      this.setContent(route);
    }
  }

  /** Returns the current route's rendered template for the host element. */
  render(): TemplateResult | typeof nothing {
    return this.content;
  }

  private onNavigate(event: any): void {
    // Let the browser handle navigations we can't or shouldn't intercept.
    if (
      !event.canIntercept ||
      event.hashChange ||
      event.downloadRequest !== null ||
      event.formData
    ) {
      return;
    }

    const url = new URL(event.destination.url);
    if (url.origin !== window.location.origin) {
      return;
    }

    if (!this.match(url)) {
      return;
    }

    event.intercept({
      handler: () => this.activate(this.match(url)!),
    });
  }

  private match(url: URL): Route | undefined {
    const route = this.routes.find((r) =>
      new URLPatternCtor({ pathname: r.path }).test({ pathname: url.pathname })
    );
    return route ?? this.fallback;
  }

  private async activate(route: Route): Promise<void> {
    if (route.load) {
      await route.load();
    }
    this.setContent(route);
    this.dispatchEvent(new CustomEvent('route-changed', { detail: { route } }));
  }

  private setContent(route: Route): void {
    this.content = route.render();
    if (route.title) {
      document.title = route.title;
    }
  }
}

export const router = new Router({
  routes: [
    {
      path: resolveRouterPath(),
      title: 'Home',
      render: () => html`<app-home></app-home>`,
    },
    {
      path: resolveRouterPath('about'),
      title: 'About',
      load: () => import('./pages/app-about/app-about.js'),
      render: () => html`<app-about></app-about>`,
    },
  ],
});

// This function will resolve a path with whatever Base URL was passed to the vite build process.
// Use of this function throughout the starter is not required, but highly recommended, especially if you plan to use GitHub Pages to deploy.
// If no arg is passed to this function, it will return the base URL.

export function resolveRouterPath(unresolvedPath?: string): string {
  var resolvedPath = baseURL;
  if (unresolvedPath) {
    resolvedPath = resolvedPath + unresolvedPath;
  }

  return resolvedPath;
}
