import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para capturar datos simples
import { AuthService } from '../../services/auth'; 
import { Router } from '@angular/router';

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
  
  onLogin() {
    const credenciales = { 
      email: this.loginData.email, 
      password: this.loginData.password 
    };

    this.authService.login(credenciales).subscribe({
      next: (res) => {
        // 1. Verificamos qué rol nos devolvió la base de datos
        // Importante: Si en tu DB es 'ADMIN' en mayúsculas, ponlo igual aquí
        const destino = res.rol === 'ADMIN' ? '/admin-citas' : '/inicio';
        
        console.log('Login exitoso, redirigiendo a:', destino);
        this.router.navigate([destino]);
      },
      error: (err) => alert(err.error.error || 'Correo o contraseña incorrectos')
    });
  }
  // .subscribe(), la petición nunca sale del navegador. Angular ignora las llamadas a servidores si nadie está "escuchando" la respuesta.
  onRegister() {
    // Mira si esto sale en la consola
    // console.log('Enviando datos...', this.registerData); 

    this.authService.registro(this.registerData).subscribe({
      next: (res) => {
        alert('¡Registro exitoso!');
        this.toggleFlip(); // Esto hace que la tarjeta gire al login
      },
      error: (err) => {
        console.error('Fallo el registro:', err);
        alert('Error al registrar: ' + (err.error?.error || 'Servidor no disponible'));
      }
    });
  }
}