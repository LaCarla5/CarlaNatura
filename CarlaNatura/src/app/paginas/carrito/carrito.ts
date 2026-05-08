import { Component, inject } from '@angular/core';
import { CarritoS } from '../../services/carrito-s'; // Asumiendo que tienes un servicio
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterOutlet, CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito {
  // Inyectamos el servicio con un nombre en español para el HTML
  public miCarrito = inject(CarritoS);
  productos: any[] = [];
  constructor() { }

  finalizarCompra() {

    Swal.fire({
      title: '¿Confirmar pedido?',
      text: "Se generará tu factura y se procesará el envío",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d7a4d', // El color verde de tu tema
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, finalizar compra',
      cancelButtonText: 'Revisar carrito'
    }).then((result) => {
      if (result.isConfirmed) {

        // Mostramos un spinner de "Procesando..."
        Swal.fire({
          title: 'Procesando pedido',
          text: 'Por favor, espera un momento...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Creamos el objeto con los datos que pide el servicio
        const datosParaEnviar = {
            total: this.miCarrito.precioTotal(),
            productos: this.miCarrito.productos() 
          };

        // Llamamos al servicio
        this.miCarrito.finalizarCompra(datosParaEnviar).subscribe({
          next: (res) => {
            // Cerramos el loading y mostramos éxito
            Swal.fire({
              title: '¡Compra realizada!',
              text: `Tu pedido ha sido procesado. Se ha descargado tu factura.`,
              icon: 'success',
              confirmButtonColor: '#2d7a4d'
            });
          },
          error: (err) => {
            // Cerramos el loading y mostramos error
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al procesar tu pedido. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonColor: '#d33'
            });
            console.error('Error al finalizar compra', err);
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

