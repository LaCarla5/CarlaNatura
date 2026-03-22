import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';

// Interfaz para el Login
export interface UserCredentials {
  email: string;
  password: string;
}

// Roles actualizados según tu tabla SQL
export type UserRole = 'ADMIN' | 'USER' | null; // He puesto MAYÚSCULAS para que coincida con tu SQL anterior

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = 'http://localhost:3000/api';

  // Mensajero en tiempo real
  // Inicializa con true o false dependiendo de si hay un token al arrancar
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedInSubject.asObservable(); // El Navbar se suscribirá a este

  constructor() {
    // Verificación inicial de rol (opcional, ya que usamos BehaviorSubject)
    if (isPlatformBrowser(this.platformId)) {
      const savedRole = localStorage.getItem('rol') as UserRole;
    }
  }

  // Función auxiliar para el constructor y el subject
  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  // --- LOGIN REAL CON NODE.JS ---
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (isPlatformBrowser(this.platformId)) {
          // 1. Guardamos todo en LocalStorage
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.rol);
          localStorage.setItem('userId', res.id);
          localStorage.setItem('userName', res.nombre);
          localStorage.setItem('userPhoto', res.foto || '');

          // 2. AVISAMOS AL MENSAJERO: ¡Estamos logueados!
          this.loggedInSubject.next(true);
          
          console.log('Sesión guardada y estado actualizado');
        }
      })
    );
  }

  // Este método lo siguen usando los Guards
  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  // --- REGISTRO REAL CON NODE.JS ---
  registro(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, datos);
  }

  // --- LOGOUT CORREGIDO ---
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      // Limpiamos TODAS las llaves que usas
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhoto');
      
      // AVISAMOS AL MENSAJERO: ¡Se ha cerrado sesión!
      this.loggedInSubject.next(false);
    }
    this.router.navigate(['/login']);
  }

  getUserRole(): UserRole {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('rol') as UserRole;
    }
    return null;
  }

  // --- ACTUALIZAR PERFIL ---
  actualizarPerfil(id: number, nombre: string, foto: File | null): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', nombre);

    if (foto) {
      formData.append('foto', foto);
    }

    return this.http.put<any>(`${this.apiUrl}/perfil/${id}`, formData).pipe(
      tap(res => {
        // Si el servidor devuelve el nuevo nombre/foto, actualizamos localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('userName', res.nombre);
          if (res.foto) localStorage.setItem('userPhoto', res.foto);
        }
      })
    );
  }
}