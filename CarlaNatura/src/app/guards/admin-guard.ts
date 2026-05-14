import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';


export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getUserRole();

  // Verificamos el rol que guardaste en el localStorage
  if (authService.isLoggedIn() && role === 'ADMIN') {
    return true; 
  } else {
    router.navigate(['/inicio']);
    return false;
  }
};