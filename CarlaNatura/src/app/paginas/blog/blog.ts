import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, CommonModule ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog implements OnInit{
  private http = inject(HttpClient);
  posts: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarPosts();
  }

  cargarPosts() {
    this.http.get<any[]>('http://localhost:3000/api/blog').subscribe({
      next: (res) => {
        this.posts = res;
        this.cdr.detectChanges();
        //console.log("Citas recibidas en el componente:", this.posts);
      },
      error: (err) => {
        //console.error("Error al conectar con el API de admin", err);
      }
    });
  }

}
