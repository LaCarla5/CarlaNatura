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

  // Formateamos la fecha correctamente para la DB
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const fechaISO = `${year}-${month}-${day}`; 

  const fechaFormateada = date.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  try {
    // Preguntamos al servidor qué horas están reservadas ese día
    const horasOcupadas = await this.http.get<string[]>(`http://localhost:3000/api/citas/ocupadas?fecha=${fechaISO}`)
      .toPromise() || [];

    const usuarioActivo = this.authService.getCurrentUser();

    // Creamos el menú de horas (se ponen grises/disabled si están en horasOcupadas)
    const todasLasHoras = ['09:00', '10:00', '11:00', '16:00', '17:00'];
    const opcionesHoraHtml = todasLasHoras.map(hora => {
      const estaOcupada = horasOcupadas.includes(hora);
      return `
        <option value="${hora}" ${estaOcupada ? 'disabled style="color: #999; background-color: #eee;"' : ''}>
          ${hora} ${estaOcupada ? ' 🔒 (Ocupada)' : ''}
        </option>`;
    }).join('');

    // 4. Lanzamos el formulario superpuesto
    const { value: formValues } = await Swal.fire({
      title: 'Reserva tu cita',
      html: `
        <p class="text-muted">Día: <b>${fechaFormateada}</b></p>
        <div class="mb-3 text-start">
          <label class="form-label fw-bold">Nombre</label>
          <input id="swal-nombre" class="form-control" value="${usuarioActivo?.nombre || ''}" readonly>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label fw-bold">Hora disponible</label>
          <select id="swal-hora" class="form-select">
            ${opcionesHoraHtml} </select>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label fw-bold">Servicio</label>
          <select id="swal-servicio" class="form-select">
            <option value="Consulta Nutricional">Consulta Nutricional</option>
            <option value="Dieta Personalizada">Dieta Personalizada</option>
            <option value="Seguimiento">Seguimiento</option>
          </select>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label fw-bold">Notas</label>
          <textarea id="swal-descripcion" class="form-control" rows="2" placeholder="Opcional..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Reserva',
      confirmButtonColor: '#198754',
      preConfirm: () => {
        return {
          nombre: (document.getElementById('swal-nombre') as HTMLInputElement).value,
          servicio: (document.getElementById('swal-servicio') as HTMLSelectElement).value,
          hora: (document.getElementById('swal-hora') as HTMLSelectElement).value,
          descripcion: (document.getElementById('swal-descripcion') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues) {
      this.enviarCita(fechaISO, formValues);
    }

  } catch (error) {
    console.error("Error al cargar disponibilidad:", error);
    Swal.fire('Error', 'No se pudo conectar con el servidor para ver las horas libres.', 'error');
  }
}
  

  private enviarCita(fechaFinal: string, datos: any) {
    const payload = {
      ...datos,
      email: this.authService.getUserEmail(),
      cliente_id: this.authService.getUserId(),
      fecha: fechaFinal,
      estado: 'pendiente'
    };

    this.http.post('http://localhost:3000/api/citas', payload).subscribe({
      next: () => {
        // Generar Link Google Calendar
        const f = fechaFinal.replace(/-/g, '');
        const h = datos.hora.replace(/:/g, '') + '00';
        const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Cita+CarlaNatura&dates=${f}T${h}/${f}T${h}&details=${datos.descripcion}&sf=true&output=xml`;

        Swal.fire({
          title: '¡Reservado!',
          html: `Cita enviada con éxito.<br><br><a href="${googleUrl}" target="_blank" class="btn btn-primary">Añadir a Google Calendar</a>`,
          icon: 'success'
        });
      },
      error: () => Swal.fire('Error', 'Error al guardar la cita', 'error')
    });
  }
}