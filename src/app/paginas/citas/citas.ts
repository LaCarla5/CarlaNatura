import { Component, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { CalendarModule, CalendarView, CalendarDateFormatter, CalendarNativeDateFormatter } from 'angular-calendar';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { AuthService } from '../../guards/auth-guard'; 

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, CalendarModule],
  templateUrl: './citas.html',
  styleUrl: './citas.scss',
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CalendarNativeDateFormatter,
    },
  ],
})
export class Citas {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Esta función protege los botones de Anterior/Siguiente
  comprobarAcceso() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  // Función principal cuando pinchan en un día
  dayClicked({ date }: { date: Date }): void {
    if (!this.isBrowser) return;

    // VERIFICACIÓN DE SEGURIDAD
    if (!this.authService.isLoggedIn()) {
      alert('Debes iniciar sesión para reservar una cita.');
      this.router.navigate(['/login']);
      return;
    }

    // SI ESTÁ LOGUEADO, PROCEDEMOS CON LA RESERVA
    const servicio = prompt('Introduce el servicio: consulta, dudas, dieta...');
    const nombre = prompt('¿Tu nombre para la reserva?');
    const email = prompt('¿A qué email enviamos la confirmación?');
    const clienteId = prompt('Introduce tu ID de cliente:'); 

    if (nombre && email && clienteId && servicio) {
      
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      const fechaFormateada = `${year}-${month}-${day}`;

      const payload = {
        nombre,
        email,
        cliente_id: clienteId,
        servicio: servicio,
        fecha: fechaFormateada,
        hora: "10:00:00"
      };

      this.http.post('http://localhost:3000/api/citas', payload)
        .subscribe({
          next: () => alert('¡Cita registrada y confirmada por correo!'),
          error: (err) => {
            console.error(err);
            alert('Error al procesar la reserva.');
          }
        });
    }
  }
}