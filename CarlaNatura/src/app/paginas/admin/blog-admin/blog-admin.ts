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
  standalone: true,
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
  formularioEnviado = false;
  archivoSeleccionado: File | null = null;
  tipoPost: 'contenido' | 'enlace' = 'contenido';

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

        this.post = [...postsMapeados]; // Actualizamos el array principal
        // Forzamos detección de cambios inmediatamente
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener los posts:", err);
      }
    });
  }

  agregarPost() {
    this.formularioEnviado = true;

    // Validación de campos obligatorios (Título y Categoría)
    if (!this.nuevoPost.titulo || !this.nuevoPost.categoria) {
      Swal.fire('Campos obligatorios', 'El título y la categoría no pueden estar vacíos', 'warning');
      return;
    }

    // 2. Lógica de URL: Si escribe en el campo URL, avisamos.
    if (this.nuevoPost.urlExterna && this.nuevoPost.urlExterna.trim() !== '') {
      Swal.fire({
        title: '¡Aviso de enlace!',
        text: 'Si rellenas el campo de URL, el contenido escrito no se visualizará. ¿Deseas continuar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, usar URL',
        cancelButtonText: 'Cambiar a texto'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarEnvio();
        }
      });
    } else {
      // Si no hay URL, el contenido es obligatorio
      if (!this.nuevoPost.contenido) {
        Swal.fire('Contenido vacío', 'Si no pones una URL, debes escribir contenido para el post', 'warning');
        return;
      }
      this.ejecutarEnvio();
    }
  }

  ejecutarEnvio() {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    const formData = new FormData();
    formData.append('titulo', this.nuevoPost.titulo);
    formData.append('categoria', this.nuevoPost.categoria);
    formData.append('contenido', this.nuevoPost.contenido || '');
    formData.append('urlExterna', this.nuevoPost.urlExterna || '');
    formData.append('autor_id', idUsuario.toString());

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.http.post(this.apiUrl, formData).subscribe({
      next: () => {
        Swal.fire('¡Publicado!', 'La noticia se ha guardado correctamente', 'success');
        this.resetForm();
        this.mostrarFormulario = false;
        this.cargarPosts();
        this.cdr.detectChanges();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la noticia', 'error')
    });
  }

  abrirEditor(noticia: any) {
    Swal.fire({
      title: 'Editar Publicación',
      html: `
      <div class="text-start">
        <label class="fw-bold mb-1">Título</label>
        <input id="swal-titulo" class="swal2-input m-0 w-100" value="${noticia.titulo}">
        
        <label class="fw-bold mt-3 mb-1">Categoría</label>
        <select id="swal-categoria" class="swal2-input m-0 w-100">
          <option value="Salud" ${noticia.categoria === 'Salud' ? 'selected' : ''}>Salud</option>
          <option value="Nutrición" ${noticia.categoria === 'Nutrición' ? 'selected' : ''}>Nutrición</option>
          <option value="Cosmética" ${noticia.categoria === 'Cosmética' ? 'selected' : ''}>Cosmética</option>
          <option value="Recetas" ${noticia.categoria === 'Recetas' ? 'selected' : ''}>Recetas</option>
        </select>

        <div id="contenedor-url" class="mt-3">
          <label class="fw-bold mb-1">Enlace Externo (Opcional)</label>
          <input id="swal-url" class="swal2-input m-0 w-100" placeholder="https://..." value="${noticia.urlExterna || ''}">
        </div>

        <div id="contenedor-contenido" class="mt-3" style="display: ${noticia.urlExterna ? 'none' : 'block'};">
          <label class="fw-bold mb-1">Contenido</label>
          <textarea id="swal-contenido" class="swal2-textarea m-0 w-100" style="height: 120px;">${noticia.contenido || ''}</textarea>
        </div>
        
        <label class="fw-bold mt-3 mb-1">Cambiar Imagen (Opcional)</label>
        <input type="file" id="swal-imagen" class="form-control">
      </div>
    `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      didOpen: () => {
        const inputUrl = document.getElementById('swal-url') as HTMLInputElement;
        const contContenido = document.getElementById('contenedor-contenido') as HTMLElement;

        // Escuchamos cuando el usuario escribe en la URL
        inputUrl.addEventListener('input', () => {
          if (inputUrl.value.trim() !== '') {
            contContenido.style.display = 'none'; // Ocultamos contenido si hay URL
          } else {
            contContenido.style.display = 'block'; // Mostramos contenido si borra la URL
          }
        });
      },
      preConfirm: () => {
        const titulo = (document.getElementById('swal-titulo') as HTMLInputElement).value;
        const categoria = (document.getElementById('swal-categoria') as HTMLSelectElement).value;
        const urlExterna = (document.getElementById('swal-url') as HTMLInputElement).value;
        const contenido = (document.getElementById('swal-contenido') as HTMLTextAreaElement).value;
        const imagen = (document.getElementById('swal-imagen') as HTMLInputElement).files?.[0];

        if (!titulo || !categoria) {
          Swal.showValidationMessage('Título y Categoría son obligatorios');
          return false;
        }

        // Si el usuario añadió una URL nueva que antes no estaba, lanzamos el aviso
        if (urlExterna && urlExterna !== noticia.urlExterna) {
          return Swal.fire({
            title: '¿Confirmar Enlace?',
            text: 'Al añadir una URL, el contenido guardado dejará de mostrarse.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, aplicar'
          }).then((res) => {
            if (res.isConfirmed) return { titulo, categoria, urlExterna, contenido, imagen };
            return false;
          });
        }

        return { titulo, categoria, urlExterna, contenido, imagen };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.actualizarPost(noticia.id, result.value);
      }
    });
  }

  actualizarPost(id: number, data: any) {
    const formData = new FormData();
    formData.append('titulo', data.titulo);
    formData.append('categoria', data.categoria);
    formData.append('contenido', data.urlExterna ? '' : data.contenido); // Limpiamos contenido si hay URL
    formData.append('urlExterna', data.urlExterna || '');

    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }

    this.http.put(`${this.apiUrl}/${id}`, formData).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'La noticia se ha actualizado', 'success');
        this.cargarPosts();
        this.cdr.detectChanges();
      },
      error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
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
            this.cdr.detectChanges();
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }


  resetForm() {
    this.formularioEnviado = false; // Reset de validación visual
    this.archivoSeleccionado = null;
    this.nuevoPost = {
      titulo: '',
      categoria: '',
      contenido: '',
      imagen: '',
      urlExterna: '',
      autor_id: '',
      fecha_publicacion: new Date()
    };
  }
}
