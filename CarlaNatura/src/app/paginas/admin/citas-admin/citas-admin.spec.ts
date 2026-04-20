import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitasAdmin } from './citas-admin';

describe('CitasAdmin', () => {
  let component: CitasAdmin;
  let fixture: ComponentFixture<CitasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitasAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
