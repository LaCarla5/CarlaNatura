import { Component, inject } from '@angular/core';
import { CarritoS } from '../../services/carrito/carrito-s'; // Asumiendo que tienes un servicio
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth/auth';


@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterOutlet, CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito {
  // Inyectamos el servicio de carrito
  public miCarrito = inject(CarritoS);
  // Inyectamos el servicio del auth
  private authService = inject(AuthService);
  productos: any[] = [];
  constructor() { }

finalizarCompra() {
    Swal.fire({
      title: '¿Confirmar pedido?',
      text: "Se generará tu factura y se procesará el envío",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d7a4d',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, finalizar compra',
      cancelButtonText: 'Revisar carrito'
    }).then((result) => {
      if (result.isConfirmed) {

        const usuarioActual = this.authService.getCurrentUser();

        Swal.fire({
          title: 'Procesando pedido',
          text: 'Por favor, espera un momento...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const datosParaEnviar = {
          usuario_id: usuarioActual?.id,
          total: this.miCarrito.precioTotal(),
          productos: this.miCarrito.productos() 
        };

        this.miCarrito.finalizarCompra(datosParaEnviar).subscribe({
          next: (res) => {
            Swal.fire({
              title: '¡Compra realizada!',
              text: `Tu pedido ha sido procesado. Se ha descargado tu factura.`,
              icon: 'success',
              confirmButtonColor: '#2d7a4d'
            });
          },
          error: (err) => {
              // Si es 403, cerramos el loading y salimos. El Swal lo lanza el servicio.
              if (err.status === 403) {
                Swal.close(); 
                return;
              }

              // Solo si NO es 403, mostramos el error genérico
              Swal.fire('Error', 'Hubo un problema inesperado', 'error');
            }
          });
        }
    });
  }

  confirmarVaciar() {
      this.miCarrito.vaciarTodo();
  }

  confirmarEliminar(idProducto: number) {
      this.miCarrito.eliminar(idProducto);
  }
}

