import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para usar el nombre en el input de edición
import { AuthService } from '../../services/auth/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UbicacionS } from '../../services/ubicacion/ubicacion-s';


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
  private ubicacionS = inject(UbicacionS);
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
  apiUrl = 'https://carlanatura.onrender.com'; // Tu servidor Node
  // Cambia esto en la declaración de variables arriba:
  fotoPorDefecto = 'https://carlanatura.onrender.com/uploads/perfil/imagenUsuarioEjemplo.jpg';

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
      this.cdr.detectChanges();
    }
  }

  cargarDatos() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = localStorage.getItem('userId');

    if (this.userId) {
      this.authService.obtenerPerfil(this.userId).subscribe({
        next: (user) => {
          this.userName = user.nombre;
          this.userRole = user.rol;
          this.userGender = user.genero;
          this.userPhone = user.telefono;
          this.userStreet = user.domicilio;
          this.userCP = user.cp;
          this.userCity = user.ciudad;
          this.userComunity = user.comunidad_autonoma;
          this.userCountry = user.pais;

          // --- AJUSTE PARA LA FOTO ---
          const serverUrl = 'https://carlanatura.onrender.com/uploads/perfil/';
          const timestamp = new Date().getTime(); // Generamos el sello de tiempo

          if (user.foto_perfil) {
            // Si la foto es una URL externa (http), la dejamos tal cual
            // Si es un archivo local, le pegamos el timestamp
            this.userPhoto = user.foto_perfil.startsWith('http')
              ? user.foto_perfil
              : `${serverUrl}${user.foto_perfil}?t=${timestamp}`;
          } else {
            this.userPhoto = this.fotoPorDefecto;
          }

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

    if (this.nombreEditado.length < 3) {
      Swal.fire('Nombre inválido', 'El nombre debe tener al menos 3 caracteres', 'warning');
      return;
    }

    const regexTelefono = /^[679]\d{8}$/; // Empieza por 6, 7 o 9 y tiene 9 dígitos
    if (!regexTelefono.test(this.telefonoEditado)) {
      Swal.fire('Teléfono inválido', 'Introduce un número de teléfono español válido (9 dígitos)', 'warning');
      return;
    }

    const cpLimpio = this.cpEditado?.toString().trim() || '';

    if (cpLimpio.length !== 5) {
      Swal.fire('CP inválido', 'El código postal debe tener 5 dígitos', 'warning');
      return;
    }

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
        console.log('Respuesta del servidor:', res);

        // Identificar el nombre del archivo devuelto por el servidor
        const nombreArchivo = res.foto || res.foto_perfil;
        const serverUrl = 'https://carlanatura.onrender.com/uploads/perfil/';
        const timestamp = new Date().getTime();

        // Limpiar estados de edición inmediatamente
        this.editMode = false;
        this.fotoPreview = null;
        this.fotoSeleccionada = null;
        
        // Forzar el "blanco" momentáneo para romper la caché
        this.userPhoto = null;
        this.cdr.detectChanges(); 

        // Actualizar LocalStorage para que al pulsar F5 no salga la vieja
        localStorage.setItem('userName', this.nombreEditado);
        localStorage.setItem('userPhone', this.telefonoEditado);
        localStorage.setItem('userStreet', this.domicilioEditado);
        localStorage.setItem('userCP', this.cpEditado);
        localStorage.setItem('userCity', this.ciudadEditado);
        localStorage.setItem('userGender', this.generoEditado);
        if (nombreArchivo) {
            localStorage.setItem('userPhoto', nombreArchivo);
        }

        // Aplicar cambios visuales tras un pequeño delay (esperando al servidor)
        setTimeout(() => {
          // Si no hay archivo, usamos la foto que ya tenía el usuario o la de por defecto
          if (nombreArchivo) {
            this.userPhoto = `${serverUrl}${nombreArchivo}?t=${timestamp}`;
          } else if (!this.userPhoto) {
            this.userPhoto = this.fotoPorDefecto.includes('http') 
            ? this.fotoPorDefecto 
            : `https://carlanatura.onrender.com/${this.fotoPorDefecto}`;
          }

          // Sincronizar el resto de variables de texto
          this.userName = this.nombreEditado;
          this.userGender = this.generoEditado;
          this.userPhone = this.telefonoEditado;
          this.userStreet = this.domicilioEditado;
          this.userCP = this.cpEditado;
          this.userCity = this.ciudadEditado;
          this.userComunity = this.caEditado;
          this.userCountry = this.paisEditado;

          // Avisar al Navbar (Estado Global)
          this.authService.actualizarEstadoUsuario(this.userName, this.userPhoto);

          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 400);

        Swal.fire({ icon: 'success', title: '¡Perfil actualizado!', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');

        // 1. Si el servidor nos dice que el teléfono ya existe (Status 400)
        if (err.status === 400 && err.error.error_type === 'DUPLICADO_TELEFONO') {
          Swal.fire({
            icon: 'error',
            title: 'Registro Duplicado',
            text: err.error.mensaje, // "No se pueden guardar los cambios porque este número..."
            confirmButtonColor: '#2d7a4d'
          });
        }
        // 2. Si es cualquier otro error (Status 500, conexión, etc.)
        else {
          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'Hubo un problema al conectar con el servidor. Inténtalo más tarde.',
            confirmButtonColor: '#d33'
          });
        }
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

  buscarCP() {
    if (this.cpEditado && this.cpEditado.length === 5) {
      //console.log("Buscando CP:", this.cpEditado); // <-- LOG 1

      this.ubicacionS.getInfoPorCP(this.cpEditado).subscribe({
        next: (data: any) => {
          //console.log("Respuesta de la API:", data);

          if (data && data.places && data.places.length > 0) {
            const info = data.places[0];

            // Asignación con nombres de propiedades exactos de Zippopotam
            this.ciudadEditado = info['place name'];
            this.caEditado = info['state'];
            this.paisEditado = 'España';

            //console.log("Campos asignados:", this.ciudadEditado, this.caEditado); // <-- LOG 3

            this.cdr.markForCheck();
            this.cdr.detectChanges();
          } else {
            //console.warn("La API respondió pero no encontró lugares.");
          }
        },
        error: (err) => {
          console.error("Error en la petición a la API:", err);
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }
}