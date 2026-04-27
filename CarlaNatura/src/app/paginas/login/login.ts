import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para capturar datos simples
import { AuthService } from '../../services/auth'; 
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  // Añadimos CommonModule para el [class.flipped] y FormsModule para los inputs
  imports: [CommonModule, FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

// login.ts
export class Login {
  isFlipped = false;
  loginData = { email: '', password: '' };
  registerData = { nombre: '', email: '', password: '', rol: 'USER' };

  private authService = inject(AuthService);
  private router = inject(Router);

  toggleFlip() { this.isFlipped = !this.isFlipped; }
  
  // Validacion de contraseña
  private validarPassword(pass: string): { valida: boolean; mensaje: string } {
    if (pass.length < 8) {
      return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(pass)) {
      return { valida: false, mensaje: 'La contraseña debe incluir al menos una mayúscula.' };
    }
    if (!/[0-9]/.test(pass)) {
      return { valida: false, mensaje: 'La contraseña debe incluir al menos un número.' };
    }
    return { valida: true, mensaje: '' };
  }

  validaciones = {
  largo: false,
  mayuscula: false,
  numero: false
  };

  actualizarValidaciones() {
    const pass = this.registerData.password || '';
    this.validaciones.largo = pass.length >= 8;
    this.validaciones.mayuscula = /[A-Z]/.test(pass);
    this.validaciones.numero = /[0-9]/.test(pass);
  }

  esFormularioValido(): boolean {
    return (
      this.registerData.nombre.length > 2 &&
      this.registerData.email.includes('@') &&
      this.validaciones.largo &&
      this.validaciones.mayuscula &&
      this.validaciones.numero
    );
  }

  onLogin() {
      this.authService.login(this.loginData).subscribe({
        next: (res) => {
          Swal.fire({
            title: '¡Bienvenido de nuevo!',
            text: `Hola ${res.nombre}, iniciando sesión...`,
            icon: 'success',
            timer: 1500, // Se cierra solo en 1.5 seg
            showConfirmButton: false,
            timerProgressBar: true
          }).then(() => {
            // Independiente del ROL siempre se les llevara a inicio
            this.router.navigate(['/inicio']);
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error de acceso',
            text: err.error?.error || 'Credenciales incorrectas',
            icon: 'error',
            confirmButtonColor: '#198754'
          });
        }
      });
    }

  // .subscribe(), la petición nunca sale del navegador. Angular ignora las llamadas a servidores si nadie está "escuchando" la respuesta.
onRegister() {
  const chequeo = this.validarPassword(this.registerData.password);
  if (!chequeo.valida) return;

  this.authService.registro(this.registerData).subscribe({
    next: () => {
      Swal.fire({
        title: '¡Cuenta creada!',
        text: 'Registro completado con éxito. Ahora puedes entrar.',
        icon: 'success',
        confirmButtonColor: '#2d5a27', // Tu color verde
        confirmButtonText: 'Ir al Login'
      }).then((result) => {
        // Forzamos el giro manual asegurándonos de que sea true o false según necesites
        // Si isFlipped = true significa "viendo el registro", debemos ponerlo en false para ver el login
        this.isFlipped = false; 

        // Pasamos el email para que el usuario no tenga que escribirlo otra vez
        this.loginData.email = this.registerData.email;
        
        // Limpiamos los datos de registro
        this.registerData = { nombre: '', email: '', password: '', rol: 'USER' };
        
        // Opcional: Limpiamos los checks visuales
        this.validaciones = { largo: false, mayuscula: false, numero: false };
      });
    },
    error: (err) => {
      Swal.fire({
        title: 'Fallo en el registro',
        text: err.error?.error || 'No se pudo crear la cuenta',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  });
}
}