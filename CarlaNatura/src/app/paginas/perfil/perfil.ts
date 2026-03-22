import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core'; // Añadimos OnInit
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit { // Mejor usar ngOnInit para cargar datos
  public authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  userName: string | null = 'Usuario';
  userRole: string | null = 'USER';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // 1. CORRECCIÓN: Los nombres deben coincidir con tu AuthService
      this.userRole = localStorage.getItem('rol'); 
      
      // 2. Si no guardaste el nombre en el login, mostrará 'Usuario Distinguido'
      this.userName = localStorage.getItem('userName') || 'Usuario Distinguido';
      
      // 3. SEGURIDAD EXTRA: Si alguien entra aquí sin token por error, fuera.
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
    }
  }

  onLogout() {
    this.authService.logout();
    // El logout del servicio ya limpia el localStorage y redirige.
  }
}