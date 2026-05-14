import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
// Obtener los datos del formulario  [(ngModel)]="nuevoPost.titulo"
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth';


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

// Asegúrate de tenerlo inyectado en el constructor o como variable de clase:
// private cdr = inject(ChangeDetectorRef); 

  agregarPost() {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    const formData = new FormData();
    formData.append('titulo', this.nuevoPost.titulo);
    formData.append('categoria', this.nuevoPost.categoria);
    formData.append('contenido', this.nuevoPost.contenido);
    formData.append('urlExterna', this.nuevoPost.urlExterna || '');
    formData.append('autor_id', idUsuario.toString());

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.http.post(this.apiUrl, formData).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Noticia publicada', 'success');

        // --- MEJORA DE RECARGA ---
        this.resetForm();
        this.mostrarFormulario = false;
        this.archivoSeleccionado = null;

        // Esperamos 300ms para dar tiempo al servidor a terminar la escritura
        setTimeout(() => {
          this.cargarPosts(); 
          this.cdr.detectChanges(); // Forzamos a Angular a mirar la lista nueva
        }, 300);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo guardar la noticia', 'error');
      }
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
