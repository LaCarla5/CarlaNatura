import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, CommonModule ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog {
articulos = [
    {
      id: 1,
      titulo: 'Genera tu propia Dieta equilibradas',
      resumen: 'Se capaz de generar tu propia dieta medianta unos simples pasos...',
      imagen: 'recursos/img/WebDietas.png',
      categoria: 'Dietas y Salud',
      urlExterna: 'https://dietascarlanatura.streamlit.app/', 
      // Control de si es externa o no
      esExterno: true,  
      fecha: '05 Abr 2026',
      lectura: 4
    },
    {
      id: 2,
      titulo: 'Cuidado de la piel en primavera',
      resumen: 'Aprende a preparar tu piel para el cambio de estación con productos 100% orgánicos.',
      imagen: 'recursos/img/piel.jpg',
      categoria: 'Belleza',
      esExterno: false,
      fecha: '02 Abr 2026',
      lectura: 6
    }
  ];
}
