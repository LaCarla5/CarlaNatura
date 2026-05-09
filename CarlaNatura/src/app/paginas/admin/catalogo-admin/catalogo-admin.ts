import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'; // Asegúrate de importar Swal

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

  productos: any[] = [];
  mostrarFormulario = false;
  editando = false; // Nueva bandera
  idEditando: number | null = null;
  fotoSeleccionada: File | null = null;

  nuevoProducto = {
    nombre: '',
    precio: 0,
    stock: 0,
    descripcion: ''
  };

  ngOnInit() { this.cargarProductos(); }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => { this.productos = res; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    // Si el usuario cierra el formulario, cancelamos la edición para limpiar los datos
    if (!this.mostrarFormulario) {
      this.cancelar();
    }
  }

  onFileSelected(event: any) {
    this.fotoSeleccionada = event.target.files[0];
  }

  // Carga los datos en el formulario para editar
  prepararEdicion(p: any) {
    this.editando = true;
    this.mostrarFormulario = true;
    this.idEditando = p.id;
    this.nuevoProducto = {
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      descripcion: p.descripcion || ''
    };
  }

  guardar() {
    const formData = new FormData();
    formData.append('nombre', this.nuevoProducto.nombre);
    formData.append('precio', this.nuevoProducto.precio.toString());
    formData.append('stock', this.nuevoProducto.stock.toString());
    formData.append('descripcion', this.nuevoProducto.descripcion);
    if (this.fotoSeleccionada) {
      formData.append('imagen', this.fotoSeleccionada);
    }

    if (this.editando && this.idEditando) {
      // MODO EDICIÓN (PUT)
      this.http.put(`${this.apiUrl}/${this.idEditando}`, formData).subscribe({
        next: () => this.finalizarOperacion('Producto actualizado'),
        error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      });
    } else {
      // MODO NUEVO (POST)
      this.http.post(this.apiUrl, formData).subscribe({
        next: () => this.finalizarOperacion('Producto creado'),
        error: () => Swal.fire('Error', 'No se pudo crear', 'error')
      });
    }
  }

  finalizarOperacion(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.cargarProductos();
    this.cancelar();
  }

  cancelar() {
    this.resetForm();
    this.mostrarFormulario = false;
    this.editando = false;
    this.idEditando = null;
    this.fotoSeleccionada = null;
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
          this.cargarProductos();
          Swal.fire('Eliminado', '', 'success');
        });
      }
    });
  }

  resetForm() {
    this.nuevoProducto = { nombre: '', precio: 0, stock: 0, descripcion: '' };
  }
}