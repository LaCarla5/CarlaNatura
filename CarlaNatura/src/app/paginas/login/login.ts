import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  // Inyecta la deteccion de cambios
  private cdr = inject(ChangeDetectorRef);
  // Variable para controlar la visibilidad
  mostrarPasswordReg = false;
  mostrarPasswordLogin = false;
  // Comprobar si esta girado
  isFlipped = false;
  // Obtener datos de login
  loginData = { email: '', password: '' };
  // Obtener datos de registro
  registerData = { nombre: '', email: '', password: '', rol: 'USER' };

  private authService = inject(AuthService);
  private router = inject(Router);

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.mostrarPasswordReg = false;
    this.mostrarPasswordLogin = false;
  }

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

  // Validaciones de contraseña
  actualizarValidaciones() {
    const pass = this.registerData.password || '';
    this.validaciones.largo = pass.length >= 8;
    this.validaciones.mayuscula = /[A-Z]/.test(pass);
    this.validaciones.numero = /[0-9]/.test(pass);
  }

  // Comprobacion de correo incluye mediante regex y contraseña
  esFormularioValido(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emailValido = emailRegex.test(this.registerData.email);

    return (
      this.registerData.nombre.length > 2 &&
      emailValido &&
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
          confirmButtonColor: '#2d5a27',
          confirmButtonText: 'Ir al Login'
        }).then((result) => {
          this.isFlipped = false;
          this.cdr.detectChanges();
          // Limpiamos datos
          setTimeout(() => {
            this.registerData = { nombre: '', email: '', password: '', rol: 'USER' };
            this.validaciones = { largo: false, mayuscula: false, numero: false };
            this.mostrarPasswordReg = false;
          }, 300);

          this.loginData.email = this.registerData.email;
          this.resetFormularios();
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

  private resetFormularios() {
    this.registerData = { nombre: '', email: '', password: '', rol: 'USER' };
    this.validaciones = { largo: false, mayuscula: false, numero: false };
  }
}