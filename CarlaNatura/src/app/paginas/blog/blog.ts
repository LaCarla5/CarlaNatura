import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, CommonModule],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog implements OnInit {
  private http = inject(HttpClient);
  posts: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarPosts();
  }

  cargarPosts() {
    this.http.get<any[]>('http://localhost:3000/api/blog').subscribe({
      next: (res) => {
        this.posts = res.map(post => ({
          ...post,
          // Construimos la URL: Servidor + Alias + Nombre del archivo en la BD
           imagen_url: `http://localhost:3000/uploads/blog/${post.imagen}`
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar posts", err)
    });
  }

  verNoticiaInterna(post: any) {
    Swal.fire({
      title: `<span style="color: #2d7a4d; font-family: 'Playfair Display', serif; font-size: 2rem;">${post.titulo}</span>`,
      html: `
      <div style="text-align: left; padding: 0 10px;">
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">
          <i class="bi bi-tag"></i> ${post.categoria} | <i class="bi bi-calendar3"></i> ${post.fecha_publicacion || 'Reciente'}
        </p>
        <hr style="border-top: 1px solid #eee;">
        <div style="line-height: 1.8; font-size: 1.15rem; color: #333; font-family: 'Georgia', serif;">
          ${post.contenido}
        </div>
      </div>
    `,
      imageUrl: post.imagen_url,
      imageWidth: '100%',
      imageHeight: '300px',
      imageAlt: 'Imagen de la noticia',
      confirmButtonText: 'Finalizar lectura',
      confirmButtonColor: '#2d7a4d',
      width: '900px', // Tamaño extra grande
      padding: '2rem',
      showCloseButton: true,
      background: '#fff url(https://www.transparenttextures.com/patterns/paper.png)', // Sutil textura de papel
      customClass: {
        popup: 'animated fadeInDown'
      }
    });
  }
}
