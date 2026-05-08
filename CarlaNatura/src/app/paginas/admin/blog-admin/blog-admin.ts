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
  archivoSeleccionado: File | null = null;

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
  }

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
        console.log("Datos recibidos del servidor:", res);
        
        // Mapeamos y asignamos a una variable nueva para asegurar la reactividad
        const postsMapeados = res.map(p => ({
          ...p,
          imagen_url: `http://localhost:3000/uploads/blog/${p.imagen}`
        }));

        this.post = postsMapeados; // Actualizamos el array principal
        this.cdr.detectChanges();  // Forzamos a Angular a "pintar" los cambios
      },
      error: (err) => {
        console.error("Error al obtener los posts:", err);
      }
    });
  }

  agregarPost() {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    const formData = new FormData();
    formData.append('titulo', this.nuevoPost.titulo);
    formData.append('categoria', this.nuevoPost.categoria);
    formData.append('contenido', this.nuevoPost.contenido);
    formData.append('urlExterna', this.nuevoPost.urlExterna || '');
    formData.append('autor_id', idUsuario.toString());
    formData.append('fecha_publicacion', new Date().toISOString());

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.http.post(this.apiUrl, formData).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Noticia publicada', 'success');

        // --- PASOS DE RECARGA ---
        this.cargarPosts();       // 1. Vuelve a pedir la lista al servidor
        this.resetForm();         // 2. Limpia los inputs del formulario
        this.mostrarFormulario = false; // 3. Cierra el panel de agregar
        this.archivoSeleccionado = null; // 4. Olvida el archivo anterior
      },
      error: (err) => Swal.fire('Error', 'No se pudo guardar', 'error')
    });
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Eliminar noticia?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La noticia ha sido borrada', 'success');

            // --- PASO DE RECARGA ---
            this.cargarPosts(); // Actualiza la tabla quitando el elemento borrado
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar', 'error')
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
