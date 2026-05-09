import { TestBed } from '@angular/core/testing';

import { UbicacionS } from './ubicacion-s';

describe('UbicacionS', () => {
  let service: UbicacionS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UbicacionS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
