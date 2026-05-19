import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { CitasService } from '../../../services/citas/citas';

@Component({
  selector: 'app-citas-admin',
  imports: [CommonModule, CalendarModule],
  standalone: true,
  templateUrl: './citas-admin.html',
  styleUrl: './citas-admin.scss',
})
export class CitasAdmin implements OnInit {
  private http = inject(HttpClient);
  private citasService = inject(CitasService);
  refresh = new Subject<void>();

  citasPendientes: any[] = [];
  eventosCalendario: CalendarEvent[] = [];
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  ngOnInit() {
    this.cargarPendientes();
    this.cargarCalendario();
  }

  cargarPendientes() {
    this.http.get<any[]>('https://carlanatura.onrender.com/api/admin/citas/pendientes').subscribe({
      next: (res) => {
        this.citasPendientes = res;
        //console.log("Citas recibidas en el componente:", this.citasPendientes);
      },
      error: (err) => {
        //console.error("Error al conectar con el API de admin", err);
      }
    });
  }

  cargarCalendario() {
    this.http.get<any[]>('https://carlanatura.onrender.com/api/admin/citas/calendario').subscribe({
      next: (res) => {
        this.eventosCalendario = res.map(cita => {
          // 1. Limpiamos el formato de la hora (de "17:30:00" a "17:30") por si viene con segundos desde MySQL
          const horaLimpia = cita.hora ? cita.hora.substring(0, 5) : '';

          // 2. Preparamos una descripción opcional abreviada para que no sature visualmente el cuadro si es muy larga
          const notaBreve = cita.descripcion ? ` - Obs: "${cita.descripcion}"` : '';

          return {
            id: cita.id,
            start: new Date(cita.fecha),
            
            title: `⏰ ${horaLimpia} | ${cita.nombre} (${cita.servicio})${notaBreve}`,
            
            // Mantenemos tus colores verde corporativo personalizados
            color: { 
              primary: '#198754', 
              secondary: '#e8f5e9' 
            },
            
            // Guardamos los datos nativos por si en el futuro deseas capturar un evento (click) en el calendario
            meta: {
              citaOriginal: cita
            }
          };
        });
        this.refresh.next();
      }
    });
  }

  async gestionarCita(cita: any, nuevoEstado: string) {
    let motivoAnulacion = '';

    // Si el admin va a rechazar, pedimos el motivo
    if (nuevoEstado === 'cancelada') {
      const { value: motivo } = await Swal.fire({
        title: 'Motivo de la anulación',
        input: 'textarea',
        inputPlaceholder: 'Escribe aquí por qué se anula la cita (se enviará al cliente)...',
        showCancelButton: true,
        confirmButtonText: 'Anular Cita',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Cancelar'
      });

      // Si el admin cierra el Swal sin escribir o cancela, no hacemos nada
      if (motivo === undefined) return;
      motivoAnulacion = motivo;
    }

    // Preparamos el paquete de datos para el correo (Nodemailer)
    const datosCita = {
      estado: nuevoEstado,
      email: cita.email,
      nombre: cita.nombre,
      servicio: cita.servicio,
      fecha: new Date(cita.fecha).toLocaleDateString('es-ES'),
      hora: cita.hora,
      motivo: motivoAnulacion 
    };

    // Llamada al API
    this.citasService.actualizarEstadoCita(cita.id, datosCita).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Correo enviado al cliente', 'success');
          this.cargarPendientes();
          this.cargarCalendario();
        },
        error: (err) => {
          console.error("Error completo:", err);
          Swal.fire('Error', 'CORS bloqueado o fallo en el servidor', 'error');
        }
    });
  }
}
