import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { serverConfig } from './app/app.config.server';

/**
 * The entry the build renders each address through.
 *
 * The `BootstrapContext` is not optional and not decorative: without it the
 * renderer raises NG0401, "Missing Platform, or the BootstrapContext was not
 * passed", and every route fails. It is the handle the prerenderer uses to
 * associate the bootstrap with the document it is building, so it has to be
 * taken as a parameter and passed straight through rather than constructed
 * here (research decision 3).
 */
export default function render(context: BootstrapContext): Promise<unknown> {
  return bootstrapApplication(App, serverConfig, context);
}
