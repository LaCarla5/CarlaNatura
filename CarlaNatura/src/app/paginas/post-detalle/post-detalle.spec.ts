import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostDetalle } from './post-detalle';

describe('PostDetalle', () => {
  let component: PostDetalle;
  let fixture: ComponentFixture<PostDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
