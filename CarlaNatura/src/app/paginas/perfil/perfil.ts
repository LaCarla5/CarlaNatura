import { Component, inject } from '@angular/core';
import { AuthService } from '../../guards/auth-guard';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.html',
})
export class Perfil {
  // Inyectamos el servicio
  public authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}