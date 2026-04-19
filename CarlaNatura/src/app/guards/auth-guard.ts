import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; 
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el método de tu servicio que mira el localStorage
  if (authService.isLoggedIn()) {
    return true; 
  } else {
    // Si no hay token, lo mandamos al login
    router.navigate(['/login']);
    return false;
  }
};