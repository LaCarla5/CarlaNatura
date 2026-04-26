import { Injectable, Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth'; // Ajusta la ruta
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {    
  public authService = inject(AuthService);
  protected readonly title = signal('CarlaNatura');
  private router = inject(Router);

  // Función para checkear el rol en tiempo real
  get userRole(): string | null {
    return this.authService.getUserRole();
  }

  // Usa el VerDetalle y le lleva donde quiere ir
  verDetalle(item: string) {
    // 1. LISTA BLANCA: Rutas que NO necesitan login
    const rutasPublicas = ['inicio', 'login', 'blog'];

    if (rutasPublicas.includes(item)) {
      this.router.navigate(['/' + item]);
      return;
    }

    // 2. RESTO DE RUTAS: Sí necesitan login
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/' + item]);
    } else {
      Swal.fire({
        title: 'Acceso Restringido',
        text: `Para acceder a ${item}, por favor inicia sesión.`,
        icon: 'info',
        iconColor: '#198754',
        confirmButtonColor: '#2d5a27',
        confirmButtonText: 'Ir al Login',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
