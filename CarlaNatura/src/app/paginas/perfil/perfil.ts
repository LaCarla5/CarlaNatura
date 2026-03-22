import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para usar el nombre en el input de edición
import { AuthService } from '../../services/auth'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  // Datos del usuario
  userId: string | null = null;
  userName: string | null = 'Usuario';
  userRole: string | null = 'USER';
  userPhoto: string | null = null;
  
  // Configuración de rutas e imágenes
  apiUrl = 'http://localhost:3000'; // Tu servidor Node
  fotoPorDefecto = 'assets/img/default-user.png'; // Asegúrate de tener esta imagen en assets
  
  // Variables para el modo edición
  editMode = false;
  nombreEditado: string = '';
  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    // 1. Verificamos si hay sesión
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // 2. Recuperamos todo lo que guardamos en el login
    this.userId = localStorage.getItem('userId');
    this.userRole = localStorage.getItem('rol'); 
    this.userName = localStorage.getItem('userName') || 'Usuario Distinguido';
    this.nombreEditado = this.userName; // Preparamos el nombre para el input de edición

    // 3. Lógica de la foto
    const fotoDB = localStorage.getItem('userPhoto');
    if (fotoDB && fotoDB !== 'null' && fotoDB !== '') {
      this.userPhoto = `${this.apiUrl}${fotoDB}`;
    } else {
      this.userPhoto = this.fotoPorDefecto;
    }
  }

  // --- MÉTODOS DE EDICIÓN ---

  activarEdicion() {
    this.editMode = true;
  }

  cancelarEdicion() {
    this.editMode = false;
    this.fotoPreview = null;
    this.fotoSeleccionada = null;
    this.nombreEditado = this.userName || '';
  }

  // Se activa cuando el usuario elige una foto en el input file
  onFileSelected(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.fotoSeleccionada = archivo;

      // Crear una previsualización para que el usuario vea cómo queda antes de guardar
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPreview = e.target.result;
      };
      reader.readAsDataURL(archivo);
    }
  }

  guardarCambios() {
    if (!this.userId) return;

    // Llamamos al servicio pasando el ID, el nuevo nombre y la foto (si hay)
    this.authService.actualizarPerfil(Number(this.userId), this.nombreEditado, this.fotoSeleccionada)
      .subscribe({
        next: (res) => {
          alert('¡Perfil actualizado con éxito!');
          
          // Actualizamos el estado local y el localStorage
          this.userName = res.nombre;
          localStorage.setItem('userName', res.nombre);
          
          if (res.foto) {
            this.userPhoto = `${this.apiUrl}${res.foto}`;
            localStorage.setItem('userPhoto', res.foto);
          }

          this.cancelarEdicion();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          alert('No se pudo actualizar el perfil');
        }
      });
  }

  onLogout() {
    this.authService.logout();
  }
}