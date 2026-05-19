import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CalendarModule, CalendarView, CalendarDateFormatter, CalendarNativeDateFormatter, CalendarEvent } from 'angular-calendar';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth/auth';

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
export class Citas implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  isBrowser: boolean;

  eventosUsuario: CalendarEvent[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Ponemos la hora a 00:00:00 para comparar solo el día
    this.viewDate.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    if (this.isBrowser && this.authService.isLoggedIn()) {
      this.cargarMisCitasCalendario();
    }
  }

  cargarMisCitasCalendario() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.http.get<any[]>(`https://carlanatura.onrender.com/api/citas/${userId}`).subscribe({
      next: (citas) => {
        this.eventosUsuario = citas.map(cita => {
          const horaLimpia = cita.hora ? cita.hora.substring(0, 5) : '';
          
          // Definimos colores dinámicos según el estado para guiar al usuario
          let colorEstado = { primary: '#198754', secondary: '#e8f5e9' }; // Verde para confirmadas
          
          if (cita.estado === 'pendiente') {
            colorEstado = { primary: '#ffc107', secondary: '#fff3cd' }; // Amarillo para pendientes
          } else if (cita.estado === 'cancelada') {
            colorEstado = { primary: '#dc3545', secondary: '#f8d7da' }; // Rojo si fue rechazada
          }

          return {
            id: cita.id,
            // Multiplicamos por 1 para asegurar que Angular Calendar trabaje con un objeto Date válido
            start: new Date(cita.fecha), 
            title: `Tu Cita: ${horaLimpia} - ${cita.servicio} (${cita.estado.toUpperCase()})`,
            color: colorEstado,
            meta: { citaOriginal: cita }
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al poblar el calendario del usuario:', err)
    });
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

  // Bloquear fechas anteriores al dia de hoy
  if (date < this.viewDate) {
    Swal.fire({
      title: 'Fecha no válida',
      text: 'No puedes reservar citas en días pasados.',
      icon: 'info',
      confirmButtonColor: '#198754'
    });
    return;
  }

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
    const horasOcupadas = await this.http.get<string[]>(`https://carlanatura.onrender.com/api/citas/ocupadas?fecha=${fechaISO}`)
      .toPromise() || [];

    const usuarioActivo = this.authService.getCurrentUser();

    // Creamos el menú de horas (se ponen grises/disabled si están en horasOcupadas)
    const todasLasHoras = ['08:00','09:00', '10:00', '11:00','12:00','13:00','16:00', '17:00','18:00'];
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
    // Obtenemos el nombre del mes para que el correo sea más bonito
    const fechaObjeto = new Date(fechaFinal);
    const diaLegible = fechaObjeto.toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    const payload = {
      ...datos,
      email: this.authService.getUserEmail(),
      cliente_id: this.authService.getUserId(),
      fecha: fechaFinal,
      fechaLegible: diaLegible, // Añadimos esto para el correo
      estado: 'pendiente'
    };

    this.http.post('https://carlanatura.onrender.com/api/citas', payload).subscribe({
      next: () => {
        // ... (tu lógica de Google Calendar se mantiene igual)
        
        Swal.fire({
          title: '¡Reserva Solicitada!',
          html: `Hemos recibido tu solicitud para el <b>${diaLegible}</b>.<br>Te llegará un correo cuando el administrador la confirme.`,
          icon: 'success',
          confirmButtonColor: '#198754'
        });
      },
      error: () => Swal.fire('Error', 'Error al guardar la cita', 'error')
    });
  }
}