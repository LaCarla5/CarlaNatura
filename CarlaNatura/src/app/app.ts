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
  if (this.authService.isLoggedIn()) {
    // Si ya está logueado, le mandamos a la sección REAL que quiere ver
    this.router.navigate(['/' + item]); 
  } else {
    // Si no está logueado, lo obligamos a pasar por el Login
    this.router.navigate(['/login']);
  }
}
}
