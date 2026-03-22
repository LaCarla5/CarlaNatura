import { Routes } from '@angular/router';

//Mis imports
import { Blog } from './paginas/blog/blog';
import { Carrito } from './paginas/carrito/carrito';
import { Catalogo } from './paginas/catalogo/catalogo';
import { Citas } from './paginas/citas/citas';
import { Inicio } from './paginas/inicio/inicio';
import { Login } from './paginas/login/login';
import { Perfil } from './paginas/perfil/perfil';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app/services/auth';

// 1. Creamos una función Guard rápida
const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Deja pasar
  } else {
    router.navigate(['/login']); // Lo manda al login
    return false; // Bloquea el paso
  }
};

export const routes: Routes = [
// Redirección inicial: Si entras a la raíz, te manda a inicio
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // PÁGINAS PÚBLICAS
  { path: 'inicio', component: Inicio },
  { path: 'login', component: Login },
  { path: 'blog', component: Blog },
  { path: 'catalogo', component: Catalogo }, // <--- Usa siempre minúsculas
  
  // PÁGINAS QUE REQUIEREN LOGIN (Cita y Carrito suelen ser privadas)
  { path: 'perfil', component: Perfil, canActivate: [authGuard]},
  { path: 'citas', component: Citas, canActivate: [authGuard]},
  { path: 'carrito', component: Carrito, canActivate: [authGuard]},

  // Ruta comodín: Si escriben cualquier cosa que no existe, al inicio
  { path: '**', redirectTo: 'inicio' }
];
