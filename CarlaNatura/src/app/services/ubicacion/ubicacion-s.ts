import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UbicacionS {
  private http = inject(HttpClient);

  // Consultar datos por Código Postal
  getInfoPorCP(cp: string) {
  // Ahora llamas a tu propio backend
  return this.http.get(`http://localhost:3000/api/proxy/cp/${cp}`);
  }
}
