import { Component, inject } from '@angular/core';
import { CarritoS } from '../../services/carrito-s'; // Asumiendo que tienes un servicio

@Component({
  selector: 'app-carrito',
  imports: [],
  templateUrl: './carrito.html',
  styleUrl: './carrito.scss',
})
export class Carrito {
// Inyectamos el servicio con un nombre en español para el HTML
  public miCarrito = inject(CarritoS);

  constructor() {}
}
