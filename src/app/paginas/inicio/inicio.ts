import { Component, signal, inject } from '@angular/core'; // Añadimos inject
import { Router } from '@angular/router'; // Importante para navegar
import { AuthService } from '../../guards/auth-guard';

import { Blog } from '../blog/blog'; 
import { Citas } from '../citas/citas';
import { Catalogo } from '../catalogo/catalogo';

@Component({
  selector: 'app-inicio',
  standalone: true, // Asumo que es standalone por el formato que usas
  imports: [Blog, Citas, Catalogo],
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
    this.router.navigate(['/login']);
  }
}
}