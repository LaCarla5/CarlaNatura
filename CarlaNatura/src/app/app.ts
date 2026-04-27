import { Component, signal, inject, OnInit, PLATFORM_ID} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de que sea standalone
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  protected readonly title = signal('CarlaNatura');

  ngOnInit() {
    // SOLO ejecutamos esto si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeunload', () => {
        this.authService.logout();
      });
    }
  }
  // Función sencilla para el HTML
  get userRole(): string | null {
    return this.authService.getUserRole();
  }

  navegarA(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }
}