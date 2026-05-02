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
  userGender: string | null = 'indefinido';
  // String para facilitar manejo de inputs
  userPhone: string | null = '';
  userStreet: string | null = '';
  // String para facilitar manejo de inputs
  userCP: string | null = '';
  userCity: string | null = '';
  userComunity: string | null = '';
  userCountry: string | null = '';


  // Configuración de rutas e imágenes
  apiUrl = 'http://localhost:3000'; // Tu servidor Node
  fotoPorDefecto = 'assets/img/default-user.png'; // Asegúrate de tener esta imagen en assets

  // Variables para el modo edición
  editMode = false;
  nombreEditado: string = '';
  generoEditado: string = '';
  telefonoEditado: string = '';
  domicilioEditado: string = '';
  cpEditado: string = '';
  ciudadEditado: string = '';
  caEditado: string = '';
  paisEditado: string = '';
  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    // Comprobar si esta iniciado sesion
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // obligatoria para obtener el id del usuario
    this.userId = localStorage.getItem('userId');

    if (this.userId) {
      // LLAMADA AL SERVIDOR PARA OBTENER DATOS REALES
      this.authService.obtenerPerfil(this.userId).subscribe({
        next: (user) => {
          // Asignamos lo que viene de la BASE DE DATOS
          this.userName = user.nombre;
          this.userRole = user.rol;
          this.userGender = user.genero || 'indefinido';
          this.userPhone = user.telefono || 'indefinido';
          this.userStreet = user.domicilio || 'indefinido';
          this.userCP = user.cp || 'indefinido';
          this.userCity = user.ciudad || 'indefinido';
          this.userComunity = user.comunidad_autonoma || 'indefinido';
          this.userCountry = user.pais || 'indefinido';

          // Actualizamos la foto con la lógica que ya tenías
          const serverUrl = 'http://localhost:3000/uploads/perfil/';
          if (user.foto_perfil) {
            this.userPhoto = user.foto_perfil.startsWith('http')
              ? user.foto_perfil
              : `${serverUrl}${user.foto_perfil}`;
          } else {
            this.userPhoto = this.fotoPorDefecto;
          }

          // Sincronizamos el formulario de edición
          this.resetFormulario();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al obtener datos de la DB", err);
        }
      });
    }
  }

  // --- MÉTODOS DE EDICIÓN ---

  activarEdicion() {
    this.resetFormulario(); // Esto copia userName -> nombreEditado, etc.
    this.editMode = true;
    this.cdr.detectChanges();
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
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.authService.actualizarPerfil(
      Number(this.userId),
      this.nombreEditado,
      this.fotoSeleccionada,
      this.generoEditado,
      this.telefonoEditado,
      this.domicilioEditado,
      this.cpEditado,
      this.ciudadEditado,
      this.caEditado,
      this.paisEditado
    ).subscribe({
      next: (res) => {
        // 'res' debe traer los valores actualizados desde la base de datos

        // Actualizar LocalStorage (Usamos los valores que enviamos o los que devuelve el server)
        localStorage.setItem('userName', this.nombreEditado);
        localStorage.setItem('userGender', this.generoEditado);
        localStorage.setItem('userPhone', this.telefonoEditado);
        localStorage.setItem('userStreet', this.domicilioEditado);
        localStorage.setItem('userCP', this.cpEditado);
        localStorage.setItem('userCity', this.ciudadEditado);
        localStorage.setItem('userComunity', this.caEditado);
        localStorage.setItem('userCountry', this.paisEditado);

        if (res.foto) {
          localStorage.setItem('userPhoto', res.foto);
        }

        // 2. Actualizar variables de la vista vinculadas al HTML
        this.userName = this.nombreEditado;
        this.userGender = this.generoEditado;
        this.userPhone = this.telefonoEditado;
        this.userStreet = this.domicilioEditado;
        this.userCP = this.cpEditado;
        this.userCity = this.ciudadEditado;
        this.userComunity = this.caEditado;
        this.userCountry = this.paisEditado;

        if (res.foto) {
          const serverUrl = 'http://localhost:3000/uploads/perfil/';
          this.userPhoto = `${serverUrl}${res.foto}`;
        }

        // 3. Limpieza y refresco de UI
        this.editMode = false;
        this.fotoPreview = null;
        this.fotoSeleccionada = null;

        // Forzamos a Angular a renderizar los nuevos valores inmediatamente
        this.cdr.detectChanges();

        Swal.fire({ icon: 'success', title: '¡Guardado!', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el perfil.' });
      }
    });
  }

  // Función auxiliar para resetear el formulario al estado actual del usuario
  resetFormulario() {
    this.nombreEditado = this.userName || '';
    this.generoEditado = this.userGender || 'indefinido';
    this.telefonoEditado = this.userPhone || '';
    this.domicilioEditado = this.userStreet || '';
    this.cpEditado = this.userCP || '';
    this.ciudadEditado = this.userCity || '';
    this.caEditado = this.userComunity || '';
    this.paisEditado = this.userCountry || '';
  }

  onLogout() {
    this.authService.logout();
  }
}