import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from './auth';
import { Injector } from '@angular/core';

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
private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:3000/api/carrito';

  public productos = signal<any[]>([]);

  constructor() {
    const auth = inject(AuthService);
    const platformId = inject(PLATFORM_ID);

    // 1. Reacción automática (cuando el usuario cambia)
    effect(() => {
      const user = auth.getCurrentUser(); // O la señal que tengas de usuario
      if (user && user.id) {
        this.cargarCarritoBD();
      }
    }, { allowSignalWrites: true });

    // 2. DISPARO INICIAL (Para cuando refrescas la página F5)
    if (isPlatformBrowser(platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.cargarCarritoBD(); 
      }
    }
  }

  cargarCarritoBD() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => this.productos.set(res),
      error: () => this.productos.set([])
    });
  }

  añadir(producto: any) {
    // IMPORTANTE: Solo mandamos el producto_id. El servidor saca el usuario_id del token.
    const body = { producto_id: producto.id, cantidad: 1 };
    
    this.http.post(this.apiUrl, body).subscribe({
      next: () => this.cargarCarritoBD(),
      error: (err) => console.error('Error al añadir:', err)
    });
  }

  eliminar(productoId: number) {
    // CORRECCIÓN: Ya no pasamos /id_usuario/id_producto
    // Solo pasamos el id del producto, el servidor ya sabe quién es el usuario por el token
    this.http.delete(`${this.apiUrl}/${productoId}`).subscribe({
      next: () => {
        this.productos.update(lista => lista.filter(p => p.producto_id !== productoId));
      }
    });
  }

  vaciarTodo() {
    // CORRECCIÓN: Limpia el carrito del usuario identificado por el token
    this.http.delete(`${this.apiUrl}/vaciar/todo`).subscribe({
      next: () => this.productos.set([]),
      error: (err) => console.error('Error al vaciar:', err)
    });
  }

  // --- FINLIZAR COMPRA Y PDF ---

  finalizarCompra(pedido: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/pedidos', pedido).pipe(
      tap((res: any) => {
        if (res.success) {
          // 1. Generamos el PDF con los datos actuales
          this.generarFacturaPDF(res.pedidoId, pedido);
          // 2. Limpiamos la señal local (la BD ya la limpia el servidor)
          this.productos.set([]);
        }
      })
    );
  }

  private generarFacturaPDF(idPedido: number, datos: any) {
    const doc = new jsPDF();
    if (!datos || !datos.productos) return;

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

  // --- TOTALES ---
  cantidadTotal = computed(() => this.productos().reduce((acc, p) => acc + (p.cantidad || 1), 0));
  precioTotal = computed(() => this.productos().reduce((acc, p) => acc + (p.precio * (p.cantidad || 1)), 0));
}