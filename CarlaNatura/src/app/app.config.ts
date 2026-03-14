import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core'; // 
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// 2. REGISTRA EL IDIOMA (Fuera de la constante appConfig)
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' }, // calendario en español
    provideRouter(
      routes, 
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ), 
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(),
    provideHttpClient(withFetch()), 
    importProvidersFrom(
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory,
      })
    )
  ]
};