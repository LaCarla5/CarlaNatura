import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminPedidosS } from '../../../services/admin-pedidos/admin-pedidos-s';

@Component({
  selector: 'app-compras-admin',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './compras-admin.html',
  styleUrl: './compras-admin.scss',
})
export class ComprasAdmin {
  private http = inject(HttpClient); // Inyectamos el cliente HTTP
  private cdr = inject(ChangeDetectorRef);
  private pedidosService = inject(AdminPedidosS);

  pedidos: any[] = [];
  pedidoEnEdicion: any = null; // Si esta en edicion o no para el form
  notificacionEnviada: boolean = false; // Que se envie la notificacion
  motivoInput: string = ""; // Motivos por los que se va a cambiar el pedido
  pedidosFiltrados: any[] = []; // Lista que mostraremos en el HTML
  filtroBusqueda: string = "";  // Para el input de búsqueda
  detallesPedido: any[] = [];   // Productos del pedido seleccionado

  ngOnInit(): void {
    this.cargarPedidos();
    this.cdr.detectChanges();
  }

  // Este es el método que te faltaba (Error TS2339)
  cargarPedidos() {
    // Asegúrate de que this.apiUrl sea 'https://carlanatura.onrender.com'
    this.http.get(`https://carlanatura.onrender.com/api/admin/pedidos`).subscribe({
      next: (res: any) => {
        this.pedidos = res;
        this.pedidosFiltrados = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener pedidos:", err)
    });
  }

  aplicarFiltro() {
    const busqueda = this.filtroBusqueda.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      p.nombre_usuario.toLowerCase().includes(busqueda) ||
      p.id.toString().includes(busqueda)
    );
  }

  iniciarEdicion(pedido: any): void {
    // 1. Limpiamos estados anteriores
    this.pedidoEnEdicion = null; 
    this.detallesPedido = [];
    
    // 2. Cargamos el nuevo pedido
    this.pedidoEnEdicion = { ...pedido };
    this.notificacionEnviada = false;
    this.motivoInput = "";

    // 3. Traemos los detalles y forzamos el renderizado
    this.pedidosService.getDetallesPedido(pedido.id).subscribe({
      next: (res) => {
        this.detallesPedido = res;
        this.cdr.markForCheck(); // Notifica a Angular que hay datos nuevos
        this.cdr.detectChanges(); // Fuerza el dibujo
      },
      error: (err) => console.error("Error al cargar detalles", err)
    });
  }

  enviarAviso(): void {
    if (!this.motivoInput) {
      Swal.fire('Error', 'Escribe un motivo para desbloquear la edición', 'error');
      return;
    }

    Swal.showLoading();

    this.http.post('https://carlanatura.onrender.com/api/admin/pedidos/notificar', {
      pedidoId: this.pedidoEnEdicion.id,
      emailCliente: this.pedidoEnEdicion.email,
      motivo: this.motivoInput
    }).subscribe({
      next: (res: any) => {
        // Asegúrate de que tu servidor devuelva { success: true }
        if (res.success || res) {
          this.notificacionEnviada = true; 
          this.cdr.markForCheck(); 
          this.cdr.detectChanges(); // <--- ESTO DESBLOQUEA EL FORMULARIO AL INSTANTE
          Swal.fire('Notificado', 'El cliente ha sido avisado. Ya puedes editar.', 'success');
        }
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo enviar el correo', 'error');
      }
    });
  }

  confirmarCambios(): void {
    this.http.put(`https://carlanatura.onrender.com/api/admin/pedidos/${this.pedidoEnEdicion.id}`, this.pedidoEnEdicion)
      .subscribe({
        next: () => {
          Swal.fire('Éxito', 'Pedido actualizado', 'success');
          this.pedidoEnEdicion = null;
          this.cargarPedidos(); // Recargamos la tabla
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el pedido', 'error')
      });
  }

  cancelarPedidoAdmin(): void {
    Swal.fire({
      title: '¿Cancelar este pedido?',
      text: "Se notificará al cliente y el pedido quedará como 'fallido'",
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Explica el motivo de la cancelación al cliente...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar pedido',
      cancelButtonText: 'Volver'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // 1. Notificamos al cliente la cancelación
        this.http.post('https://carlanatura.onrender.com/api/admin/pedidos/notificar', {
          pedidoId: this.pedidoEnEdicion.id,
          emailCliente: this.pedidoEnEdicion.email,
          motivo: `PEDIDO CANCELADO: ${result.value}`
        }).subscribe();

        // 2. Cambiamos el estado en la base de datos
        this.pedidoEnEdicion.estado_pago = 'fallido';
        this.confirmarCambios(); 
      } else if (result.isConfirmed && !result.value) {
        Swal.fire('Error', 'Debes dar una explicación para cancelar', 'error');
      }
    });
  }
}
