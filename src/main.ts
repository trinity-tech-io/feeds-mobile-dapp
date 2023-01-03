import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'hammerjs';
import { Logger } from './app/services/logger';
import { defineCustomElements } from '@teamhive/lottie-player/loader';

// Replace default console logs with our own logger
Logger.init(console);

if (environment.production) {
  enableProdMode();
}
void defineCustomElements(window);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.log(err));
