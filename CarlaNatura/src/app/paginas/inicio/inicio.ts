import { Component, signal, inject } from '@angular/core'; // Añadimos inject
import { Router } from '@angular/router'; // Importante para navegar
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; // Mensaje mas suaves
import { AuthService, UserRole } from '../../services/auth/auth';

@Component({
  selector: 'app-inicio',
  standalone: true, // Asumo que es standalone por el formato que usas
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly title = signal('CarlaNatura');

  // Inyección de servicios con el método moderno de Angular
  private authService = inject(AuthService);
  private router = inject(Router);

  // Propiedad para que el HTML sepa si redibuja las tarjetas como admin o como cliente
  get isAdmin(): boolean {
    if (!this.authService.isLoggedIn()) {
      return false;
    }
    const rol = this.authService.getUserRole() as any;
    //console.log(rol)
    return rol === 'ADMIN'; 
  }

verDetalle(item: string) {
    // 1. Si está logueado, comprobamos si es admin para cambiar la ruta
    if (this.authService.isLoggedIn()) {
      
      // Si el usuario es administrador, le sumamos '-admin' a la ruta (ej: 'catalogo' pasa a 'catalogo-admin')
      // Pero si por algún motivo el HTML ya te manda 'catalogo-admin', evitamos duplicarlo
      let rutaFinal = item;
      if (this.isAdmin && !item.endsWith('-admin')) {
        // Corrección especial para 'citas' -> 'cita-admin' si tu ruta de admin se llama así
        if (item === 'citas') {
          rutaFinal = 'cita-admin';
        } else {
          rutaFinal = `${item}-admin`;
        }
      }

      this.router.navigate(['/' + rutaFinal]); 
    } 
    // 2. Si no está logueado, salta el aviso para ir al login
    else {
      Swal.fire({
        title: '¡Atención!',
        text: 'Para acceder a esta sección de CarlaNatura, por favor inicia sesión primero.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#bf9525',
        confirmButtonText: 'Ir al Login',
        cancelButtonText: 'Seguir mirando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  verBlog(item: string) {
    // El blog siempre es accesible, pero si el parámetro ya viene mapeado 
    // desde el HTML como 'blog-admin' o 'blog', redirigirá correctamente.
    this.router.navigate(['/' + item]); 
  }
}