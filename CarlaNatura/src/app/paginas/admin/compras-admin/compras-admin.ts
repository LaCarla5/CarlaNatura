import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-compras-admin',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './compras-admin.html',
  styleUrl: './compras-admin.scss',
})
export class ComprasAdmin {
  private http = inject(HttpClient); // Inyectamos el cliente HTTP

  pedidos: any[] = [];
  pedidoEnEdicion: any = null;
  notificacionEnviada: boolean = false;
  motivoInput: string = "";

  ngOnInit(): void {
    this.cargarPedidos();
  }

  // Este es el método que te faltaba (Error TS2339)
  cargarPedidos() {
    // Asegúrate de que this.apiUrl sea 'http://localhost:3000'
    this.http.get(`http://localhost:3000/api/admin/pedidos`).subscribe({
      next: (res: any) => this.pedidos = res,
      error: (err) => console.error("Error al obtener pedidos:", err)
    });
  }

  iniciarEdicion(pedido: any): void {
    this.pedidoEnEdicion = { ...pedido };
    this.notificacionEnviada = false;
    this.motivoInput = "";
  }

  enviarAviso(): void {
    if (!this.motivoInput) {
      Swal.fire('Error', 'Debes escribir un motivo', 'error');
      return;
    }

    this.http.post('http://localhost:3000/api/admin/pedidos/notificar', {
      pedidoId: this.pedidoEnEdicion.id,
      emailCliente: this.pedidoEnEdicion.email,
      motivo: this.motivoInput
    }).subscribe({
      next: () => {
        this.notificacionEnviada = true;
        Swal.fire('Notificado', 'Ya puedes proceder con los cambios', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo enviar el correo', 'error')
    });
  }

  confirmarCambios(): void {
    this.http.put(`http://localhost:3000/api/admin/pedidos/${this.pedidoEnEdicion.id}`, this.pedidoEnEdicion)
      .subscribe({
        next: () => {
          Swal.fire('Éxito', 'Pedido actualizado', 'success');
          this.pedidoEnEdicion = null;
          this.cargarPedidos(); // Recargamos la tabla
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el pedido', 'error')
      });
  }
}
