import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas-admin',
  imports: [CommonModule, CalendarModule],
  templateUrl: './citas-admin.html',
  styleUrl: './citas-admin.scss',
})
export class CitasAdmin implements OnInit {
  private http = inject(HttpClient);

  citasPendientes: any[] = [];
  eventosCalendario: CalendarEvent[] = [];
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  ngOnInit() {
    this.cargarPendientes();
    this.cargarCalendario();
  }

  cargarPendientes() {
    this.http.get<any[]>('http://localhost:3000/api/admin/citas/pendientes').subscribe(res => {
      this.citasPendientes = res;
    });
  }

  cargarCalendario() {
    this.http.get<any[]>('http://localhost:3000/api/admin/citas/calendario').subscribe(res => {
      this.eventosCalendario = res.map(cita => ({
        start: new Date(cita.fecha + 'T' + cita.hora),
        title: `${cita.nombre} - ${cita.servicio}`,
        color: { primary: '#198754', secondary: '#e8f5e9' }
      }));
    });
  }

  gestionarCita(id: number, nuevoEstado: string, email: string) {
    this.http.patch(`http://localhost:3000/api/admin/citas/${id}`, { estado: nuevoEstado, email })
      .subscribe(() => {
        Swal.fire('Éxito', `Cita ${nuevoEstado}`, 'success');
        this.cargarPendientes();
        this.cargarCalendario();
      });
  }
}
