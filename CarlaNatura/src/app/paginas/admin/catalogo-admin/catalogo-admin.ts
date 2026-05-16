import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-catalogo-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-admin.html',
  styleUrl: './catalogo-admin.scss',
})
export class CatalogoAdmin implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'https://carlanatura.onrender.com/api/catalogo-admin';
  private cdr = inject(ChangeDetectorRef);

  productos: any[] = [];
  mostrarFormulario = false;
  editando = false;
  idEditando: number | null = null;
  fotoSeleccionada: File | null = null;

  // Inicializamos siempre con una categoría por defecto para evitar el Error 500
  nuevoProducto: any = {
    nombre: '',
    precio: 0,
    stock: 0,
    descripcion: '',
    categoria_id: 1
  };

  ngOnInit() { this.cargarProductos(); }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.productos = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.cancelar();
    }
  }

  onFileSelected(event: any) {
    this.fotoSeleccionada = event.target.files[0];
  }

  prepararEdicion(p: any) {
    this.editando = true;
    this.mostrarFormulario = true;
    this.idEditando = p.id;

    // Mapeamos los datos, asegurando que categoria_id no sea nulo
    this.nuevoProducto = {
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      descripcion: p.descripcion || '',
      categoria_id: p.categoria_id || 1 // <-- IMPORTANTE: Asignamos el ID
    };
    this.cdr.detectChanges();
  }

  guardar() {
    const formData = new FormData();
    formData.append('nombre', this.nuevoProducto.nombre);
    formData.append('precio', this.nuevoProducto.precio.toString());
    formData.append('stock', this.nuevoProducto.stock.toString());
    formData.append('descripcion', this.nuevoProducto.descripcion);

    // ENVIAMOS LA CATEGORÍA AL SERVIDOR
    formData.append('categoria_id', this.nuevoProducto.categoria_id.toString());

    if (this.fotoSeleccionada) {
      formData.append('imagen', this.fotoSeleccionada);
    }

    if (this.editando && this.idEditando) {
      this.http.put(`${this.apiUrl}/${this.idEditando}`, formData).subscribe({
        next: () => this.finalizarOperacion('Producto actualizado'),
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar. Revisa que la categoría exista.', 'error');
        }
      });
    } else {
      this.http.post(this.apiUrl, formData).subscribe({
        next: () => this.finalizarOperacion('Producto creado'),
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo crear el producto.', 'error');
        }
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
    this.cdr.detectChanges();
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#198754',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            this.cargarProductos();
            Swal.fire('Eliminado', 'Producto borrado con éxito', 'success');
          },
          error: (err) => {
            if (err.status === 409) {
              Swal.fire({
                title: 'Producto Protegido',
                icon: 'info',
                html: `
        <div style="text-align: left;">
          <p>${err.error.mensaje}</p>
          <hr>
          <p><b>💡 Consejo de administración:</b></p>
          <ul>
            <li>Establece el <b>stock a 0</b> para que no aparezca disponible.</li>
            <li>Si necesitas renovarlo, <b>crea un producto nuevo</b> con la información actualizada.</li>
          </ul>
          <p><small>Esto garantiza que puedas seguir viendo el historial de compras correctamente.</small></p>
        </div>
      `,
                confirmButtonColor: '#198754',
                confirmButtonText: 'Entendido'
              });
            } else {
              Swal.fire('Error', 'No se ha podido procesar la solicitud.', 'error');
            }
          }
        });
      }
    })
  }

  resetForm() {
    this.nuevoProducto = {
      nombre: '',
      precio: 0,
      stock: 0,
      descripcion: '',
      categoria_id: 1 // Resetear a la categoría por defecto
    };
  }
}