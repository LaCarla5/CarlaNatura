import { Injectable, signal, computed } from '@angular/core';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})

export class CarritoS {
// Lista de productos (Signal privada)
  private listaProductos = signal<Producto[]>([]);

  // Exponemos los productos como lectura
  public productos = this.listaProductos.asReadonly();

  // Cantidad total de artículos (computado)
  public cantidadTotal = computed(() => this.listaProductos().length);

  // Precio total (computado)
  public precioTotal = computed(() => 
    this.listaProductos().reduce((acc, prod) => {
      // Convertimos el precio a número antes de sumar
      const precioNumerico = Number(prod.precio) || 0; 
      return acc + precioNumerico;
    }, 0)
  );

  // Añadir un producto al carrito
  añadir(producto: Producto) {
    this.listaProductos.update(actuales => [...actuales, producto]);
  }

  // Eliminar un producto por su ID
  eliminar(idProducto: number) {
    this.listaProductos.update(actuales => 
      actuales.filter(p => p.id !== idProducto)
    );
  }

  // Vaciar todo el carrito
  limpiar() {
    this.listaProductos.set([]);
  }
}