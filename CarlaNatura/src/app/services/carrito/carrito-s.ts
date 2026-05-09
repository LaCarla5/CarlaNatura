import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Injector } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../auth/auth';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  descripcion: string;
  stock: number;
  stockEfectivo?: number;
  cantidadSeleccionada?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoS {
  private http = inject(HttpClient);
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
    });

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

  añadir(producto: Producto, cantidad: number = 1) {
    // Ahora usamos la cantidad que viene por parámetro del componente
    const body = { 
      producto_id: producto.id, 
      cantidad: cantidad 
    };

    this.http.post(this.apiUrl, body).subscribe({
      next: () => this.cargarCarritoBD(),
      error: (err) => console.error('Error al añadir:', err)
    });
  }

  eliminar(productoId: number) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: "Esta acción quitará el producto de tu carrito",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2d7a4d', // Tu verde corporativo
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si confirma, hacemos la petición
        this.http.delete(`${this.apiUrl}/${productoId}`).subscribe({
          next: () => {
            this.productos.update(lista => lista.filter(p => p.producto_id !== productoId));
            // Opcional: Mini alerta de éxito que desaparece sola
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Producto eliminado',
              showConfirmButton: false,
              timer: 1500
            });
          }
        });
      }
    });
  }

  vaciarTodo() {
    Swal.fire({
      title: '¿Vaciar todo el carrito?',
      text: "Se eliminarán todos los productos que has añadido. ¡No podrás deshacerlo!",
      icon: 'error', // Icono de error para indicar peligro
      showCancelButton: true,
      confirmButtonColor: '#d33', // Rojo para el botón de borrar todo
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, vaciar carrito',
      cancelButtonText: 'Mantener productos'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/vaciar/todo`).subscribe({
          next: () => {
            this.productos.set([]);
            Swal.fire(
              '¡Vaciado!',
              'Tu carrito ahora está limpio.',
              'success'
            );
          },
          error: (err) => {
            console.error('Error al vaciar:', err);
            Swal.fire('Error', 'No se pudo vaciar el carrito', 'error');
          }
        });
      }
    });
  }

  // --- FINLIZAR COMPRA Y PDF ---

finalizarCompra(pedido: any): Observable<any> {
  return this.http.post('http://localhost:3000/api/pedidos', pedido).pipe(
    tap((res: any) => {
      if (res.success) {
        // Generar Factura
        this.generarFacturaPDF(res.pedidoId, pedido);
        
        // VACIAR LA SIGNAL (Esto quita el número 6 de la pantalla)
        this.productos.set([]); 
        
        // Confirmar con la BD por si acaso
        this.cargarCarritoBD(); 

        setTimeout(() => {
          this.cargarCarritoBD(); 
        }, 300);
      }
    })
  );
}

  private generarFacturaPDF(idPedido: number, datos: any) {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    // CABECERA DE LA FACTURA ---
    doc.setFontSize(22);
    doc.setTextColor(45, 122, 77); // Tu verde corporativo
    doc.text('CARLA NATURA', 14, 20); // Título de la empresa

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Calle Saludable 123, Valencia', 14, 28);
    doc.text('CIF: 12345678Z', 14, 33);

    // DATOS DEL PEDIDO ---
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`FACTURA Nº: ${idPedido}`, 140, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, 140, 28);

    // TABLA DE PRODUCTOS ---
    const filas = datos.productos.map((p: any) => [
      p.nombre,
      p.cantidad || 1,
      `${p.precio}€`,
      `${(p.precio * (p.cantidad || 1)).toFixed(2)}€` // Subtotal por producto
    ]);

    autoTable(doc, {
      startY: 45, // Donde empieza la tabla para no pisar el logo
      head: [['Producto', 'Cant.', 'Precio Unid.', 'Subtotal']],
      body: filas,
      headStyles: { fillColor: [45, 122, 77] },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'center' }, // Cantidad centrada
        3: { halign: 'right' }   // Subtotal a la derecha
      }
    });

    // TOTALES ---
    // Calculamos la posición donde terminó la tabla
    const finalY = (doc as any).lastAutoTable.finalY || 60;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: ${datos.total.toFixed(2)}€`, 140, finalY + 15);

    //PIE DE PÁGINA ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text('Gracias por confiar en CarlaNatura para tu bienestar.', 14, finalY + 30);

    // Guardar archivo
    doc.save(`Factura_Natura_${idPedido}.pdf`);
  }

  // TOTALES ---
  cantidadTotal = computed(() => this.productos().reduce((acc, p) => acc + (p.cantidad || 1), 0));
  precioTotal = computed(() => this.productos().reduce((acc, p) => acc + (p.precio * (p.cantidad || 1)), 0));
}