import { Component, signal, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { CarritoS, Producto } from '../../services/carrito-s'; // Asumiendo que tienes un servicio
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
        this.productos = res;
        // FORZAMOS a Angular a pintar los productos de inmediato
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar catálogo:', err);
      }
    });
  }

  // Método para añadir al carrito
  agregarAlCarrito(producto: Producto) {
    this.carritoService.añadir(producto);

    // Una notificación pequeñita en la esquina
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${producto.nombre} añadido`,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }

}
