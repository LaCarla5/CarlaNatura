import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasAdmin } from './compras-admin';

describe('ComprasAdmin', () => {
  let component: ComprasAdmin;
  let fixture: ComponentFixture<ComprasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
