import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth'; 
import { CommonModule } from '@angular/common';

@Component({
selector: 'app-catalogo',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})

export class Catalogo {
  public authService = inject(AuthService); 
  private router = inject(Router);
  protected readonly title = signal('CarlaNatura');

  productos = [
      { id: 1, nombre: 'Producto A', imagen: 'https://www.agoracosmeticanatural.com/?srsltid=AfmBOordOhwcQ_9867H-Kedt-uV-JfGFx9dbOEM9VnjeBHakDgGUwZEr' },
      { id: 2, nombre: 'Producto B', imagen: 'https://sendaaromatica.com/cosmetica-ecologica-cara-y-cuerpo/' },
      { id: 3, nombre: 'Producto C', imagen: 'https://sendaaromatica.com/tienda-productos-de-cosmetica/' }
    ];

  irAlCatalogo(id: number) {
    // 1. Primero comprobamos con el servicio
    if (this.authService.isLoggedIn()) {
      console.log('Usuario validado. Entrando al producto:', id);
      // Si está logueado, navega al detalle del producto
      this.router.navigate(['/catalogo', id]); 
    } else {
      // 2. Si no está logueado, aviso y al login
      console.warn('Acceso denegado. Redirigiendo a login...');
      alert('Para ver los detalles de nuestros productos naturales, por favor inicia sesión.');
      this.router.navigate(['/login']);
    }
  }
}
