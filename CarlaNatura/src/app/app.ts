import { Injectable, Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth'; // Ajusta la ruta
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  public authService = inject(AuthService); // Inyectamos el servicio
  protected readonly title = signal('CarlaNatura');
  private router = inject(Router);

  // Usa el VerDetalle y le lleva donde quiere ir
  verDetalle(item: string) {
    // Definimos qué rutas son privadas (necesitan login)
    const rutasPrivadas = ['carrito', 'perfil', 'citas', 'admin/catalogo-admin'];

    if (rutasPrivadas.includes(item)) {
      // Si es privada, verificamos login
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/' + item]);
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      // Si es pública (catálogo, blog, dietas, inicio), navegamos sin preguntar
      this.router.navigate(['/' + item]);
    }
  }
}
