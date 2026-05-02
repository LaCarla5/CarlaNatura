import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para usar el nombre en el input de edición
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private cdr = inject(ChangeDetectorRef);
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
    // Verificamos si hay sesión
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Recuperamos todo lo que guardamos en el login
    this.userId = localStorage.getItem('userId');
    this.userRole = localStorage.getItem('rol');
    this.userName = localStorage.getItem('userName') || 'Usuario Distinguido';
    this.nombreEditado = this.userName; // Preparamos el nombre para el input de edición

    // Lógica de la foto
    const fotoDB = localStorage.getItem('userPhoto');
    // La ruta estática real
    const serverUrl = 'http://localhost:3000/uploads/perfil/';
    if (fotoDB && fotoDB !== 'null' && fotoDB !== '') {
      // Si la foto ya es una URL de Google/Facebook, no le añadimos el prefijo del servidor
      if (fotoDB.startsWith('http')) {
        this.userPhoto = fotoDB;
      } else {
        // Si es un nombre de archivo (ej: user-123.jpg o default.jpg)
        this.userPhoto = `${serverUrl}${fotoDB}`;
      }
    } else {
      this.userPhoto = this.fotoPorDefecto; // Una imagen en tu carpeta assets de Angular
    }
  }

  // --- MÉTODOS DE EDICIÓN ---

  activarEdicion() {
    this.editMode = true;
  }

  cancelarEdicion() {
    this.editMode = false;
    // Si existe una URL temporal, la liberamos para no gastar RAM
    if (this.fotoPreview && this.fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.fotoPreview);
    }
    this.fotoPreview = null;
    this.fotoSeleccionada = null;
    this.nombreEditado = this.userName || '';
  }

  // Se activa cuando el usuario elige una foto en el input file
  onFileSelected(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // Mostrar el cargando de SweetAlert inmediatamente
    Swal.fire({
      title: 'Cargando previsualización...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Usamos un pequeño delay para que el navegador "dibuje" el Swal
    setTimeout(() => {
        try {
          this.fotoSeleccionada = archivo;
          
          // Liberamos memoria de la previsualización anterior si existía
          if (this.fotoPreview && typeof this.fotoPreview === 'string' && this.fotoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.fotoPreview);
          }

          // Creamos la nueva previsualización (es casi instantáneo)
          this.fotoPreview = URL.createObjectURL(archivo);

          // Forzamos a Angular a darse cuenta del cambio
          this.cdr.detectChanges();

          // 3. Cerramos el mensaje de carga cuando la imagen ya está lista en el círculo
          Swal.close();
        } catch (error) {
          console.error("Error:", error);
          Swal.fire('Error', 'No se pudo procesar la imagen', 'error');
        }
      }, 200);
  }

  guardarCambios() {
    if (!this.userId || !this.nombreEditado.trim()) return;

    Swal.fire({
      title: 'Guardando...',
      didOpen: () => { Swal.showLoading(); }
    });

    this.authService.actualizarPerfil(Number(this.userId), this.nombreEditado, this.fotoSeleccionada)
      .subscribe({
        next: (res) => {
          // 2. Actualizar LocalStorage inmediatamente
          localStorage.setItem('userName', res.nombre);
          if (res.foto) {
            localStorage.setItem('userPhoto', res.foto);
          }

          // 3. Actualizar variables de la vista para que el cambio sea instantáneo
          this.userName = res.nombre;
          if (res.foto) {
            const serverUrl = 'http://localhost:3000/uploads/perfil/';
            this.userPhoto = `${serverUrl}${res.foto}`;
          }

          // Salir del modo edición y limpiar previews
          this.editMode = false;
          this.fotoPreview = null;
          this.fotoSeleccionada = null;
          this.cdr.detectChanges();

          Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1500 });

        },
        error: (err) => {
          console.error('Error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron guardar los cambios.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  onLogout() {
    this.authService.logout();
  }
}