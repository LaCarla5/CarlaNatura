import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas-admin',
  imports: [CommonModule, CalendarModule],
  standalone: true,
  templateUrl: './citas-admin.html',
  styleUrl: './citas-admin.scss',
})
export class CitasAdmin implements OnInit {
  private http = inject(HttpClient);

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
        this.eventosCalendario = res.map(cita => ({
          start: new Date(cita.fecha), // La fecha ISO que recibes ya es suficiente
          title: `${cita.nombre} - ${cita.servicio}`,
          color: { primary: '#198754', secondary: '#e8f5e9' }
        }));
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
      motivo: motivoAnulacion // Solo llevará texto si es 'cancelada'
    };

    // Llamada al API
    this.http.patch(`https://carlanatura.onrender.com/api/admin/citas/${cita.id}`, datosCita)
      .subscribe({
        next: () => {
          Swal.fire({
            title: nuevoEstado === 'confirmada' ? 'Cita Confirmada' : 'Cita Anulada',
            text: 'Se ha enviado la notificación por correo al cliente.',
            icon: 'success'
          });
          this.cargarPendientes();
          this.cargarCalendario();
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la cita', 'error')
      });
  }
}
