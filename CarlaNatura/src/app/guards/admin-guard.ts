import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; // Tu servicio


export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getUserRole();

  // Verificamos el rol que guardaste en el localStorage
  if (authService.isLoggedIn() && role === 'ADMIN') {
    return true; 
  } else {
    // Si es un usuario normal intentando "colarse", lo mandamos al catálogo
    // console.warn('Acceso denegado: Se requiere rol de ADMIN');
    router.navigate(['/inicio']);
    return false;
  }
};