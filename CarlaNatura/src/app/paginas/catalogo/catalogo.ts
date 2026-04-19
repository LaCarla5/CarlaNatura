import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth'; 
import { CommonModule } from '@angular/common';
import { CarritoS, Producto } from '../../services/carrito-s'; // Asumiendo que tienes un servicio
import { HttpClient } from '@angular/common/http';

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
  private http = inject(HttpClient);
  private carritoService = inject(CarritoS);


  private apiUrl = 'http://localhost:3000/api/catalogo';
  productos: Producto[] = [];
  constructor() {}

  ngOnInit(): void {
    this.cargarProductosBBDD();
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

  cargarProductosBBDD() {
    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.productos = res;
      },
      error: (err) => console.error('Error al cargar catálogo de usuarios:', err)
    });
  }

  // Método para añadir al carrito
  agregarAlCarrito(producto: Producto) {
      this.carritoService.añadir(producto);
      console.log('Producto agregado:', producto.nombre);
    }

}
