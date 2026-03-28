import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth'; 
import { CommonModule } from '@angular/common';
import { CarritoS, Producto } from '../../services/carrito-s'; // Asumiendo que tienes un servicio

@Component({
selector: 'app-catalogo',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})

export class Catalogo {
  public authService = inject(AuthService); 
  private router = inject(Router);
  protected readonly title = signal('CarlaNatura');

  constructor() {}

  productos = [
  { 
    id: 1, 
    nombre: 'Aceite de Lavanda', 
    precio: 15.00, 
    descripcion: 'Relajante natural.', 
    imagen: 'assets/lavanda.jpg' 
  },
  // ... más productos
];

  ngOnInit(): void {
    // Aquí podrías llamar a tu API para llenar la lista de productos
  }

  irAlCatalogo(id: number) {
    // 1. Primero comprobamos con el servicio
    if (this.authService.isLoggedIn()) {
      // Si está logueado, navega al detalle del producto
      this.router.navigate(['/catalogo', id]); 
    } else {
      // 2. Si no está logueado, aviso y al login
      console.warn('Acceso denegado. Redirigiendo a login...');
      alert('Para ver los detalles de nuestros productos naturales, por favor inicia sesión.');
      this.router.navigate(['/login']);
    }
  }

  private carritoService = inject(CarritoS);

  // Método para añadir al carrito
  agregarAlCarrito(producto: Producto) {
      this.carritoService.añadir(producto);
      console.log('Producto agregado:', producto.nombre);
    }

}
