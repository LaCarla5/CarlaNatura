import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
// Obtener los datos del formulario  [(ngModel)]="nuevoPost.titulo"
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-blog-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './blog-admin.html',
  styleUrl: './blog-admin.scss',
})
export class BlogAdmin implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/admin/blog';
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  post: any[] = [];
  mostrarFormulario = false;
  fechaActual = new Date();

  nuevoPost = {
    titulo: '',
    categoria: '',
    contenido: '',
    imagen: '',
    urlExterna: '',
    autor_id: '',
    fecha_publicacion: this.fechaActual
  };

  ngOnInit() {
    this.cargarPosts();
  }

  cargarPosts() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.post = res;
        this.cdr.detectChanges(); // Fuerza la actualización de la vista al recibir los datos
      },
      error: (err) => console.error("Error al cargar post:", err)
    });
  }

  agregarPost() {
    const idUsuario = this.authService.getUserId();

    if (!idUsuario) {
      Swal.fire('Error', 'No se pudo identificar al autor. Inicia sesión de nuevo.', 'error');
      return;
    }

    this.nuevoPost.autor_id = idUsuario;

    this.http.post(this.apiUrl, this.nuevoPost).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Post añadido correctamente al blog', 'success');
        this.cargarPosts();
        this.resetForm();
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error("Error al guardar:", err);
        Swal.fire('Error', 'No se pudo guardar el Post en la base de datos', 'error');
      }
    });
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El producto desaparecerá del blog",
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
            this.cargarPosts();
            Swal.fire('Eliminado', 'El posts ha sido borrado', 'success');
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar el posts', 'error')
        });
      }
    });
  }

  resetForm() {
    this.nuevoPost = {
      titulo: '',
      categoria: '',
      contenido: '',
      imagen: '',
      urlExterna: '',
      autor_id: '',
      fecha_publicacion: this.fechaActual
    };
  }

}
