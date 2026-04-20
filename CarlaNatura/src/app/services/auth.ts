import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';


export interface UserCredentials {
  email: string;
  password: string;
}

export type UserRole = 'ADMIN' | 'USER' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = 'http://localhost:3000/api';

  // 1. Estado de autenticación
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedInSubject.asObservable();

  // 2. NUEVO: Estado de los datos del usuario (Nombre y Foto)
  // Esto permite que el Navbar se actualice cuando cambias tu foto o nombre
  private userDataSubject = new BehaviorSubject<{nombre: string | null, foto: string | null}>({
    nombre: this.getStoredItem('userName'),
    foto: this.getStoredItem('userPhoto')
  });
  public userData$ = this.userDataSubject.asObservable();

  constructor() {}

  private hasToken(): boolean {
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('token');
  }

  private getStoredItem(key: string): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(key) : null;
  }

  // --- LOGIN ---
login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', res.token); // Guardamos el token
          localStorage.setItem('rol', res.rol); // Guardamos el rol
          localStorage.setItem('userId', res.id); // Guardamos el id
          localStorage.setItem('userName', res.nombre); // Guardamos el nombre
          localStorage.setItem('userPhoto', res.foto || ''); // Guardamos la foto
          localStorage.setItem('userEmail', res.email); // Guardamos el mail

          this.loggedInSubject.next(true);
          this.userDataSubject.next({ nombre: res.nombre, foto: res.foto });
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  registro(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, datos);
  }

  // --- LOGOUT ---
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear(); // Limpia todo de golpe
      this.loggedInSubject.next(false);
      this.userDataSubject.next({ nombre: null, foto: null });
    }
    this.router.navigate(['/login']);
  }

  getUserEmail(): string | null {
    return this.getStoredItem('userEmail');
  }

  getCurrentUser() {
    return {
      id: this.getStoredItem('userId'),
      nombre: this.getStoredItem('userName'),
      email: this.getStoredItem('userEmail'),
      rol: this.getStoredItem('rol'),
      foto: this.getStoredItem('userPhoto')
    };
  }

  getUserId(): string | null {
    return this.getStoredItem('userId');
  }
  
  getUserRole(): UserRole {
    return this.getStoredItem('rol') as UserRole;
  }

  // --- ACTUALIZAR PERFIL ---
  actualizarPerfil(id: number, nombre: string, foto: File | null): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', nombre);
    if (foto) formData.append('foto', foto);

    return this.http.put<any>(`${this.apiUrl}/perfil/${id}`, formData).pipe(
      tap(res => {
        if (isPlatformBrowser(this.platformId)) {
          // Actualizamos LocalStorage
          localStorage.setItem('userName', res.nombre);
          if (res.foto) localStorage.setItem('userPhoto', res.foto);

          // ¡IMPORTANTE! Notificamos el cambio para que el Navbar se actualice solo
          this.userDataSubject.next({ 
            nombre: res.nombre, 
            foto: res.foto || localStorage.getItem('userPhoto') 
          });
        }
      })
    );
  }
}