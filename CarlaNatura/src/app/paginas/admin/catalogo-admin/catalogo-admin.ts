import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'; // Asegúrate de importar Swal
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-catalogo-admin',
  standalone: true, // Manténlo siempre para evitar errores de carga
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-admin.html',
  styleUrl: './catalogo-admin.scss',
})
export class CatalogoAdmin implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/catalogo-admin';
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  productos: any[] = [];
  mostrarFormulario = false;

  nuevoProducto = {
    nombre: '',
    precio: 0,
    stock: 0,
    imagen: '',
    descripcion: ''
  };

  ngOnInit() {
    this.cargarProductos();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cargarProductos();
    });
  }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.productos = res;
        this.cdr.detectChanges(); // Fuerza la actualización de la vista al recibir los datos
      },
      error: (err) => console.error("Error al cargar productos:", err)
    });
  }

  agregarProducto() {
    this.http.post(this.apiUrl, this.nuevoProducto).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Producto añadido correctamente', 'success');
        this.cargarProductos();
        this.resetForm();
        this.mostrarFormulario = false;
      },
      error: () => Swal.fire('Error', 'No se pudo guardar el producto', 'error')
    });
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El producto desaparecerá del catálogo",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2d5a27',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            this.cargarProductos();
            Swal.fire('Eliminado', 'El producto ha sido borrado', 'success');
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar el producto', 'error')
        });
      }
    });
  }

  resetForm() {
    this.nuevoProducto = { nombre: '', precio: 0, stock: 0, imagen: '', descripcion: '' };
  }
}