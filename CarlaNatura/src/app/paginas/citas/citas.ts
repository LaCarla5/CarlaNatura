import { Component, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CalendarModule, CalendarView, CalendarDateFormatter, CalendarNativeDateFormatter } from 'angular-calendar';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';

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
  async dayClicked({ date }: { date: Date }): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.comprobarAcceso()) return;

    const fechaFormateada = date.toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // 1. Obtenemos los datos del usuario actual desde tu AuthService
    const usuarioActivo = this.authService.getCurrentUser(); // Asumo que tienes este método

    const { value: formValues } = await Swal.fire({
      title: 'Reserva tu cita',
      html: `
      <p class="text-muted">Día seleccionado: <b>${fechaFormateada}</b></p>
      <div class="mb-3 text-start">
        <label class="form-label">Nombre completo</label>
        <input id="swal-nombre" class="form-control" value="${usuarioActivo?.nombre || ''}">
      </div>
      
      <div class="mb-3 text-start">
        <label class="form-label">Servicio</label>
        <select id="swal-servicio" class="form-select">
          <option value="Consulta Nutricional">Consulta Nutricional</option>
          <option value="Dieta Personalizada">Dieta Personalizada</option>
          <option value="Seguimiento">Seguimiento</option>
          <option value="Dudas generales">Dudas generales</option>
        </select>
      </div>

      <div class="mb-3 text-start">
        <label class="form-label">Hora disponible</label>
        <select id="swal-hora" class="form-select">
          <option value="09:00">09:00 AM</option>
          <option value="10:00">10:00 AM</option>
          <option value="11:00">11:00 AM</option>
          <option value="16:00">04:00 PM</option>
          <option value="17:00">05:00 PM</option>
        </select>
      </div>

      <div class="mb-3 text-start">
        <label class="form-label">Descripción / Notas</label>
        <textarea id="swal-descripcion" class="form-control" rows="3" placeholder="Cuéntanos un poco más..."></textarea>
      </div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Reserva',
      confirmButtonColor: '#198754',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('swal-nombre') as HTMLInputElement).value;
        const servicio = (document.getElementById('swal-servicio') as HTMLSelectElement).value;
        const hora = (document.getElementById('swal-hora') as HTMLSelectElement).value;
        const descripcion = (document.getElementById('swal-descripcion') as HTMLTextAreaElement).value;

        if (!nombre || !servicio || !hora) {
          Swal.showValidationMessage('Por favor, rellena los campos obligatorios');
          return false;
        }
        return { nombre, servicio, hora, descripcion };
      }
    });

    // 2. Si el usuario confirma, enviamos al Backend
    if (formValues) {
      this.enviarCita(date, formValues);
    }
  }

  private enviarCita(date: Date, datos: any) {
    const usuarioId = this.authService.getUserId();
    
    const payload = {
      ...datos,
      email: this.authService.getUserEmail(), // Enviamos el email del usuario logueado automáticamente
      cliente_id: usuarioId,
      fecha: date.toISOString().split('T')[0],
      estado: 'PENDIENTE' // Muy importante para el panel admin
    };

    this.http.post('http://localhost:3000/api/citas', payload).subscribe({
      next: () => Swal.fire('¡Solicitada!', 'Tu cita ha sido enviada. El administrador la revisará pronto.', 'success'),
      error: () => Swal.fire('Error', 'No pudimos conectar con el servidor', 'error')
    });
  }
}