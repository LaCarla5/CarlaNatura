import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos Dom, para poder hace corretamente el iframe
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dietas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dietas.html',
  styleUrl: './dietas.scss',
})
export class Dietas implements OnInit{
  private sanitizer = inject(DomSanitizer);
    
    // Esto le dice a Streamlit que se prepare para ser mostrado dentro de otra web
    urlExterna: string = 'https://dietascarlanatura.streamlit.app/?embed=true';
    urlSegura!: SafeResourceUrl | undefined;

    ngOnInit() {
      // Marcamos la URL como segura para que Angular permita cargarla en el iframe
      this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(this.urlExterna);
    }
}
