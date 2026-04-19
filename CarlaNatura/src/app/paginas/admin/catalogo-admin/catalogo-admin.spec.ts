import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoAdmin } from './catalogo-admin';

describe('CatalogoAdmin', () => {
  let component: CatalogoAdmin;
  let fixture: ComponentFixture<CatalogoAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
