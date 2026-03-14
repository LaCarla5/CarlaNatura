import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  productos = [
      { id: 1, nombre: 'Producto A', imagen: 'https://www.agoracosmeticanatural.com/?srsltid=AfmBOordOhwcQ_9867H-Kedt-uV-JfGFx9dbOEM9VnjeBHakDgGUwZEr' },
      { id: 2, nombre: 'Producto B', imagen: 'https://sendaaromatica.com/cosmetica-ecologica-cara-y-cuerpo/' },
      { id: 3, nombre: 'Producto C', imagen: 'https://sendaaromatica.com/tienda-productos-de-cosmetica/' }
    ];

    constructor(private router: Router) {}

    irAlCatalogo(id: number) {
      // Navega a la ruta del catálogo pasando el ID si es necesario
      this.router.navigate(['/catalogo', id]);
    }
}
