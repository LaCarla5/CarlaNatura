import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-detalle',
  imports: [CommonModule],
  templateUrl: './post-detalle.html',
  styleUrl: './post-detalle.scss',
})
export class PostDetalle {
private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  post: any = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get(`https://carlanatura.onrender.com/api/blog/${id}`).subscribe(res => {
      this.post = res;
    });
  }
}
