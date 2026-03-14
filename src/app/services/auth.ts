import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

// 1. Interfaz para el Login (coincide con lo que espera tu Node.js)
export interface UserCredentials {
  email: string;
  password: string;
}

// 2. Roles actualizados según tu tabla SQL
export type UserRole = 'admin' | 'cliente' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private loggedIn = false;
  private userRole: UserRole = null;
  private apiUrl = 'http://localhost:3000/api'; // La URL de tu Node.js

  constructor() {
    // Verificamos sesión solo si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedToken = localStorage.getItem('userToken');
      const savedRole = localStorage.getItem('userRole') as UserRole;
      
      if (savedToken) {
        this.loggedIn = true;
        this.userRole = savedRole;
      }
    }
  }

  // --- LOGIN REAL CON NODE.JS ---
  login(credentials: UserCredentials): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        // Si el login es correcto, guardamos los datos
        this.loggedIn = true;
        this.userRole = res.rol; // 'admin' o 'cliente' desde MySQL

        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('userToken', res.token);
          localStorage.setItem('userRole', res.rol);
        }
      })
    );
  }

  // --- REGISTRO REAL CON NODE.JS ---
  registro(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, datos);
  }

  logout() {
    this.loggedIn = false;
    this.userRole = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return this.loggedIn; }
  getUserRole(): UserRole { return this.userRole; }
}