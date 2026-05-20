import { Component, signal, inject } from '@angular/core'; // Añadimos inject
import { Router } from '@angular/router'; // Importante para navegar
import Swal from 'sweetalert2'; // Mensaje mas suaves
import { AuthService, UserRole } from '../../services/auth/auth';

@Component({
  selector: 'app-inicio',
  standalone: true, // Asumo que es standalone por el formato que usas
  imports: [],
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
    
    // Al decirle "as any", TypeScript se olvida de 'UserRole' 
    // y te deja compararlo con el texto 'admin' sin protestar
    const rol = this.authService.getUserRole() as any;
    
    return rol === 'admin'; 
  }

  verDetalle(item: string) {
    // 1. Si está logueado, decidimos a qué ruta mandarlo según su rol
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/' + item]); 
    } 
    // 2. Si no está logueado, salta el aviso para ir al login
    else {
      Swal.fire({
        title: '¡Atención!',
        text: 'Para acceder a esta sección de CarlaNatura, por favor inicia sesión primero.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754', // Tu verde
        cancelButtonColor: '#bf9525',  // Tu dorado
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