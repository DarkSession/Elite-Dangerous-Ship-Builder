import { bootstrapApplication } from '@angular/platform-browser';
import { PreviewApp, previewAppConfig } from './app/preview-app';

bootstrapApplication(PreviewApp, previewAppConfig).catch((error: unknown) => console.error(error));
