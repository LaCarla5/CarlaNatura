import { Injectable, signal, computed } from '@angular/core';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
}

@Injectable({
  providedIn: 'root',
})

export class CarritoS {
// 1. Lista de productos (Signal privada)
  private listaProductos = signal<Producto[]>([]);

  // 2. Exponemos los productos como lectura
  public productos = this.listaProductos.asReadonly();

  // 3. Cantidad total de artículos (computado)
  public cantidadTotal = computed(() => this.listaProductos().length);

  // 4. Precio total (computado)
  public precioTotal = computed(() => 
    this.listaProductos().reduce((acc, prod) => acc + prod.precio, 0)
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