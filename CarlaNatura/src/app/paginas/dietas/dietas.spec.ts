import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dietas } from './dietas';

describe('Dietas', () => {
  let component: Dietas;
  let fixture: ComponentFixture<Dietas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dietas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dietas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
