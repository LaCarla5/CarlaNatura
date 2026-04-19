import { Component, OnInit, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-catalogo-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-admin.html',
  styleUrl: './catalogo-admin.scss',
})

export class CatalogoAdmin implements OnInit {
private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/catalogo-admin';

  productos: any[] = [];
  mostrarFormulario = false;

  nuevoProducto = {
    nombre: '',
    precio: 0,
    stock: 0,
    imagen: '',
    descripcion: ''
  };

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe(res => {
      this.productos = res;
    });
  }

  agregarProducto() {
    this.http.post(this.apiUrl, this.nuevoProducto).subscribe(() => {
      this.cargarProductos();
      this.resetForm();
      this.mostrarFormulario = false;
    });
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar este producto')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.cargarProductos();
      });
    }
  }

  resetForm() {
    this.nuevoProducto = { nombre: '', precio: 0, stock: 0, imagen: '', descripcion: '' };
  }
}