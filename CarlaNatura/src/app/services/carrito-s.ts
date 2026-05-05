import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  private http = inject(HttpClient); // Inyectamos el cliente HTTP

  // Exponemos los productos como lectura
  public productos = signal<any[]>([]);

  // Vaciar todo el carrito
  limpiar() {
      console.log("Vaciando carrito real. Cantidad anterior:", this.productos().length);
      this.productos.set([]);
  }

   // Eliminar un producto por su ID
  eliminar(id: number) {
    this.productos.update(actuales => actuales.filter(p => p.id !== id));
  }

  // Cantidad total de artículos (computado)
  cantidadTotal = computed(() =>
    this.productos().reduce((acc, p) => acc + (p.cantidad || 1), 0)
  );

  // Precio total (computado)
  precioTotal = computed(() =>
    this.productos().reduce((acc, p) => acc + (p.precio * (p.cantidad || 1)), 0)
  );

  // Añadir un producto al carrito
  añadir(productoNuevo: any) {
    this.productos.update(lista => {
      // 1. Buscamos si el producto ya está en el carrito
      const indice = lista.findIndex(p => p.id === productoNuevo.id);

      if (indice !== -1) {
        // 2. Si existe, creamos una copia de la lista y actualizamos la cantidad
        const nuevaLista = [...lista];
        // Incrementamos la cantidad (asegurándonos de que sea un número)
        nuevaLista[indice] = {
          ...nuevaLista[indice],
          cantidad: (nuevaLista[indice].cantidad || 1) + 1
        };
        return nuevaLista;
      } else {
        // 3. Si no existe, lo añadimos con cantidad inicial de 1
        return [...lista, { ...productoNuevo, cantidad: 1 }];
      }
    });
  }
 
  finalizarCompra(pedido: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/pedidos', pedido).pipe(
      tap((res: any) => {
        if (res.success) {
          this.generarFacturaPDF(res.pedidoId, pedido);
          this.limpiar();
        }
      })
    );
  }

  private generarFacturaPDF(idPedido: number, datos: any) {
    const doc = new jsPDF();

    // El error daba aquí porque 'datos.productos' era undefined
    // Añadimos una validación de seguridad:
    if (!datos || !datos.productos) {
      console.error("No hay productos para generar el PDF", datos);
      return;
    }

    const filas = datos.productos.map((p: any) => [
      p.nombre,
      p.cantidad || 1,
      `${p.precio}€`
    ]);

    autoTable(doc, {
      head: [['Producto', 'Cant.', 'Precio']],
      body: filas,
      headStyles: { fillColor: [45, 122, 77] }
    });

    doc.save(`Factura_Natura_${idPedido}.pdf`);
  }

}