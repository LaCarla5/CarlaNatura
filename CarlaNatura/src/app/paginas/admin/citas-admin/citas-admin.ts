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
    this.http.get<any[]>('http://localhost:3000/api/admin/citas/pendientes').subscribe({
      next: (res) => {
        this.citasPendientes = res;
        console.log("Citas recibidas en el componente:", this.citasPendientes);
      },
      error: (err) => {
        console.error("Error al conectar con el API de admin", err);
      }
    });
  }

cargarCalendario() {
    this.http.get<any[]>('http://localhost:3000/api/admin/citas/calendario').subscribe({
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

  gestionarCita(id: number, nuevoEstado: string, email: string) {
    // Usamos el email que recibimos del objeto cita para que el backend lo use en Nodemailer
    this.http.patch(`http://localhost:3000/api/admin/citas/${id}`, { estado: nuevoEstado, email })
      .subscribe({
        next: () => {
          Swal.fire('Éxito', `Cita ${nuevoEstado}`, 'success');
          this.cargarPendientes();
          this.cargarCalendario();
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar la cita', 'error')
      });
  }
}
