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
 * `title` is a message key rather than a phrase: `RouteTitleStrategy` resolves
 * it in the committed locale, so the document title changes language with
 * everything else rather than one navigation later.
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
    loadComponent: () =>
      import('./features/ship-catalogue/ship-catalogue.page').then(
        (module) => module.ShipCataloguePage,
      ),
    children: [
      {
        path: ':symbol',
        title: 'hullDetail.specifications',
        loadComponent: () =>
          import('./features/hull-detail/hull-detail.page').then((module) => module.HullDetailPage),
      },
    ],
  },
  {
    path: 'build',
    title: 'workspace.title',
    loadComponent: () =>
      import('./features/build-workspace/build-workspace.page').then(
        (module) => module.BuildWorkspacePage,
      ),
  },
  {
    path: 'builds',
    title: 'library.title',
    loadComponent: () =>
      import('./features/build-library/build-library.page').then(
        (module) => module.BuildLibraryPage,
      ),
  },
  { path: '**', redirectTo: 'ships' },
];
