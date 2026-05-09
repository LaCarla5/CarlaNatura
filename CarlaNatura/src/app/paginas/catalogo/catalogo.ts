import { Component, signal, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { CarritoS, Producto } from '../../services/carrito-s';
import { HttpClient } from '@angular/common/http';
// Para las alerta
import Swal from 'sweetalert2';
//FormsModule para el contador
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})

export class Catalogo {
  public authService = inject(AuthService);
  private router = inject(Router);
  protected readonly title = signal('CarlaNatura');
  private http = inject(HttpClient);
  private carritoService = inject(CarritoS);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios


  private apiUrl = 'http://localhost:3000/api/catalogo';
  productos: Producto[] = [];
  constructor() { }

  // Usamos SweetAlert para avisa a nuestros usuarios
  ngOnInit(): void {
    this.cargarProductosBBDD();
  }

  cargarProductosBBDD() {
    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (res) => {
        // Obtenemos los items del carrito desde tu servicio
        const itemsCarrito: any[] = (this.carritoService as any).items || [];

        this.productos = res.map(p => {
          // Buscamos si el usuario ya tiene este producto en la cesta
          const itemEnCarrito = itemsCarrito.find((i: any) => i.id === p.id);
          const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

          // Calculamos lo que queda libre para añadir
          const disponibleParaMi = p.stock - cantidadEnCarrito;

          return {
            ...p,
            stockEfectivo: disponibleParaMi, // Este es el que usaremos en el HTML
            cantidadSeleccionada: disponibleParaMi > 0 ? 1 : 0
          };
        });
        this.cdr.detectChanges();
      }
    });
  }

  // ESTA ES LA FUNCIÓN QUE TE FALTABA O NO DETECTABA
  cambiarCantidad(item: any, cambio: number) {
    if (!item.cantidadSeleccionada) item.cantidadSeleccionada = 1;

    const nuevaCantidad = item.cantidadSeleccionada + cambio;

    // Validamos contra el stockEfectivo (BBDD - Carrito)
    if (nuevaCantidad >= 1 && nuevaCantidad <= item.stockEfectivo) {
      item.cantidadSeleccionada = nuevaCantidad;
    }
  }

  agregarAlCarrito(producto: any) {
    this.carritoService.añadir(producto, producto.cantidadSeleccionada);

    // Configuración de SweetAlert elegante
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#f8fdf9', // Un verde muy clarito Natura
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: 'success',
      title: `<span style="color: #2e7d32">¡Añadido al carrito!</span>`,
      text: `${producto.nombre} (${producto.cantidadSeleccionada} ud.)`,
    });

    // Bajamos el stock visual para la sesión actual
    producto.stockEfectivo -= producto.cantidadSeleccionada;
    producto.cantidadSeleccionada = producto.stockEfectivo > 0 ? 1 : 0;
  }
}