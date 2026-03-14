import { Routes } from '@angular/router';

//Mis imports
import { Blog } from './paginas/blog/blog';
import { Carrito } from './paginas/carrito/carrito';
import { Catalogo } from './paginas/catalogo/catalogo';
import { Citas } from './paginas/citas/citas';
import { Inicio } from './paginas/inicio/inicio';
import { Login } from './paginas/login/login';
import { Perfil } from './paginas/perfil/perfil';

import { AuthService } from './guards/auth-guard';

export const routes: Routes = [
// Redirección inicial: Si entras a la raíz, te manda a inicio
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },

  // PÁGINAS PÚBLICAS
  { path: 'inicio', component: Inicio },
  { path: 'login', component: Login },
  { path: 'blog', component: Blog },
  { path: 'catalogo', component: Catalogo }, // <--- Usa siempre minúsculas
  
  // PÁGINAS QUE REQUIEREN LOGIN (Cita y Carrito suelen ser privadas)
  { path: 'perfil', component: Perfil, canActivate: [AuthService]},
  { path: 'citas', component: Citas },
  { path: 'carrito', component: Carrito },

  // Ruta comodín: Si escriben cualquier cosa que no existe, al inicio
  { path: '**', redirectTo: 'inicio' }
];
