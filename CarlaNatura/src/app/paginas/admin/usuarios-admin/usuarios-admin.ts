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
export class UsuariosAdmin implements OnInit{
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
        this.usuariosCreados = res;
        this.usuariosFiltrados = [...res]; // Copia limpia
        this.cdr.detectChanges(); // FUERZA a Angular a pintar los datos YA
      },
      error: (err) => console.error("Error al cargar usuarios", err)
    });
  }

  // Búsqueda dinámica "original"
  filtrarUsuarios() {
    this.usuariosFiltrados = this.usuariosCreados.filter(u => 
      u.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  async eliminarUsuario(id: number) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2d5a27',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar usuario'
    });

    if (result.isConfirmed) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: (res) => {
          // Si el servidor borró al usuario con éxito, volvemos a llamar a la función que hace el SELECT.
          this.cargarUsuarios(); 
          Swal.fire('¡Borrado!', 'El usuario ha sido eliminado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
      });
    }
  }
}
