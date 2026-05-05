import { Component, inject } from '@angular/core';
import { CarritoS } from '../../services/carrito-s'; // Asumiendo que tienes un servicio
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterOutlet, CommonModule,RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito {
  // Inyectamos el servicio con un nombre en español para el HTML
  public miCarrito = inject(CarritoS);
  productos: any[] = [];
  constructor() { }

  finalizarCompra() {
    // Creamos el objeto con los datos que pide el servicio
    const datosParaEnviar = {
      usuario_id: 1,
      total: this.miCarrito.precioTotal(), // Usas el valor de tu computed
      productos: this.miCarrito.productos() // Usas el valor de tu signal de productos
    };

    // Llamamos al servicio PASÁNDOLE ese objeto como argumento
    this.miCarrito.finalizarCompra(datosParaEnviar).subscribe({
      next: (res) => {
        // El PDF se genera solo gracias al 'tap' que pusimos en el servicio
        console.log('Compra procesada con ID:', res.pedidoId);
      },
      error: (err) => {
        console.error('Error al finalizar compra', err);
      }
    });
  }

  vaciarDesdeComponente() {
  console.log("¡Click detectado en el componente!");
  this.miCarrito.limpiar();
  }
}
