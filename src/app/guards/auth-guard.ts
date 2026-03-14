import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // Inyectamos el ID de la plataforma

  isLoggedIn(): boolean {
    // Solo ejecutamos localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false; // Si está en el servidor, devolvemos false por defecto
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      this.router.navigate(['/login']);
    }
  }

  getRol(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('rol');
    }
    return null;
  }
}