import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para el buscador
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.html',
  styleUrl: './usuarios-admin.scss',
})
export class UsuariosAdmin implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/admin/usuarios';
  private cdr = inject(ChangeDetectorRef);

  usuariosCreados: any[] = [];
  usuariosFiltrados: any[] = []; // Para la búsqueda dinámica
  filtro: string = '';

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.usuariosCreados = res.map(u => {
          // Usamos u.foto_perfil que es donde tienes "logo.png"
          // Si por casualidad viene vacío, ponemos una cadena vacía o tu logo
          const nombreReal = u.foto_perfil ? u.foto_perfil : 'imagenUsuarioEjemplo.jpg';

          return {
            ...u,
            // Construimos la URL con el nombre que VIENE de tu base de datos
            foto_url: `http://localhost:3000/uploads/perfil/${nombreReal}`
          };
        });

        this.usuariosFiltrados = [...this.usuariosCreados];
        this.cdr.detectChanges();

        //console.log("✅ Ahora el Admin tiene:", this.usuariosCreados[0].foto_url);
      },
      error: (err) => console.error("Error al cargar usuarios", err)
    });
  }

  // Búsqueda dinámica "original"
  filtrarUsuarios() {
    const busqueda = this.filtro.toLowerCase();

    // Filtramos y asignamos una NUEVA referencia para que Angular detecte el cambio
    this.usuariosFiltrados = this.usuariosCreados.filter(u =>
      u.nombre.toLowerCase().includes(busqueda) ||
      u.email.toLowerCase().includes(busqueda)
    );

    // Forzamos la detección de cambios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }


  cambiarEstadoBloqueo(user: any) {
    const nuevoEstado = user.activo === 1 ? 0 : 1;

    this.http.put(`http://localhost:3000/api/usuarios/bloquear/${user.id}`, { activo: nuevoEstado })
      .subscribe({
        next: () => {
          // Buscamos el usuario en el array original y actualizamos su estado
          const index = this.usuariosCreados.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.usuariosCreados[index].activo = nuevoEstado;
            // IMPORTANTE: Refrescamos la vista
            this.filtrarUsuarios();
          }

          Swal.fire({
            title: nuevoEstado === 0 ? 'Usuario Bloqueado' : 'Usuario Activado',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
          });
        },
        error: (err) => Swal.fire('Error', 'No se pudo actualizar el estado', 'error')
      });
  }

  async eliminarUsuario(user: any) {
    const result = await Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: `Se borrarán los datos de ${user.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      this.http.delete(`${this.apiUrl}/${user.id}`).subscribe({
        next: () => {
          // Eliminamos del array original mediante una nueva referencia
          this.usuariosCreados = this.usuariosCreados.filter(u => u.id !== user.id);

          // Refrescamos la vista filtrada
          this.filtrarUsuarios();

          Swal.fire('¡Borrado!', 'Usuario eliminado correctamente', 'success');
        },
        error: (err) => {
          if (err.status === 409) {
            Swal.fire({
              title: 'Acción sugerida: Bloqueo',
              text: err.error.message,
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Bloquear acceso',
              confirmButtonColor: '#ffc107'
            }).then((res) => {
              if (res.isConfirmed) {
                this.cambiarEstadoBloqueo(user);
              }
            });
          }
        }
      });
    }
  }
}
