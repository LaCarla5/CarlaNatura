import { TestBed } from '@angular/core/testing';

import { CarritoS } from './carrito-s';

describe('CarritoS', () => {
  let service: CarritoS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarritoS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
