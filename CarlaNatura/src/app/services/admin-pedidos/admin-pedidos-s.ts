import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminPedidosS {
  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api/admin/pedidos';

  getPedidos(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }

  // Nueva ruta para traer qué compró exactamente el cliente
  getDetallesPedido(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/detalles/${id}`);
  }

  notificarCliente(data: any): Observable<any> {
    return this.http.post(`${this.url}/notificar`, data);
  }

  actualizarPedido(id: number, data: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data);
  }
}
