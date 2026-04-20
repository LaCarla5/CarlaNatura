import { Component, signal, inject } from '@angular/core'; // Añadimos inject
import { Router } from '@angular/router'; // Importante para navegar
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2'; // Mensaje mas suaves

@Component({
  selector: 'app-inicio',
  standalone: true, // Asumo que es standalone por el formato que usas
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly title = signal('CarlaNatura');

  // INYECCIÓN DE SERVICIOS (Forma moderna con inject)
  private authService = inject(AuthService);
  private router = inject(Router);

  verDetalle(item: string) {
  if (this.authService.isLoggedIn()) {
    // Si ya está logueado, le mandamos a la sección REAL que quiere ver
    this.router.navigate(['/' + item]); 
  } else {
    // Si no está logueado, lo obligamos a pasar por el Login
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
}