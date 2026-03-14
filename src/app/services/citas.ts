import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  // Inyectamos el cliente HTTP para poder hacer peticiones a Node.js
  private http = inject(HttpClient);
  
  // Esta es la URL de tu servidor Node.js
  private apiUrl = 'http://localhost:3000/api';

  constructor() { }

  // 1. Para que el ADMIN vea todas las citas de la DB
  obtenerTodasLasCitas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/citas`);
  }

  // 2. Para que el ADMIN cambie el estado (Confirmada/Cancelada)
  actualizarEstadoCita(id: number, nuevoEstado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/citas/${id}`, { estado: nuevoEstado });
  }

  // 3. Para que el USUARIO cree una cita nueva
  crearCita(datosCita: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas`, datosCita);
  }
}