import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core'; // 
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from '../../src/app/interceptores/auth-interceptor'; // Importa tu función

// 2. REGISTRA EL IDIOMA (Fuera de la constante appConfig)
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    // CONFIGURACIÓN HTTP UNIFICADA ---
    provideHttpClient(
      withFetch(), 
      withInterceptors([authInterceptor])
    ),

    // --- IDIOMA Y LOCALIZACIÓN ---
    { provide: LOCALE_ID, useValue: 'es-ES' },

    // --- 3. RUTAS Y SCROLL ---
    provideRouter(
      routes, 
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ), 

    // --- RENDERIZADO Y ANIMACIONES ---
    provideClientHydration(withEventReplay()),
    provideAnimations(),

    // --- MÓDULOS EXTERNOS ---
    importProvidersFrom(
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory,
      })
    )
  ]
};