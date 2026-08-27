import { Routes } from '@angular/router';

/**
 * The application's routes.
 *
 * Four screens and one redirect. Every one of them is addressable: hull detail
 * by the package's own hull symbol, the build library by its own path even
 * though it usually appears as a layer over the screen that opened it. A
 * surface that is only reachable by clicking through another one cannot be
 * bookmarked, cannot be returned to with the back button, and cannot be told
 * apart by a screen reader from the screen behind it (routes-and-ui contract).
 *
 * `title` and `data.description` are message keys rather than phrases:
 * `RouteTitleStrategy` resolves both in the committed locale, so the document
 * title and the sentence a search result quotes change language with everything
 * else rather than one navigation later (011/FR-027). A route that declares no
 * description inherits the nearest ancestor's.
 *
 * No route carries build data in its path or query. The only build payload in
 * a URL is the `/build` fragment (FR-015).
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // Replaced rather than pushed: the redirect is not a place a Commander
    // visited, and leaving it in history makes Back a loop.
    redirectTo: 'ships',
  },
  {
    path: 'ships',
    title: 'catalogue.title',
    data: { description: 'catalogue.description' },
    loadComponent: () =>
      import('./features/ship-catalogue/ship-catalogue.page').then(
        (module) => module.ShipCataloguePage,
      ),
    children: [
      {
        // No title of its own: the reference keeps the command bar reading
        // SHIPYARD while a hull is open in the inspector (canvas 1a), and the
        // compact sheet carries the hull's name in its own heading. No
        // description of its own either — an open hull is the catalogue screen
        // with one hull selected, and the description it inherits says so.
        path: ':symbol',
        loadComponent: () =>
          import('./features/hull-detail/hull-detail.page').then((module) => module.HullDetailPage),
      },
    ],
  },
  {
    path: 'build',
    title: 'workspace.title',
    data: { description: 'workspace.description' },
    loadComponent: () =>
      import('./features/build-workspace/build-workspace.page').then(
        (module) => module.BuildWorkspacePage,
      ),
  },
  {
    path: 'builds',
    title: 'library.title',
    data: { description: 'library.description' },
    loadComponent: () =>
      import('./features/build-library/build-library.page').then(
        (module) => module.BuildLibraryPage,
      ),
  },
  { path: '**', redirectTo: 'ships' },
];
