import { TestBed } from '@angular/core/testing';

import { AdminPedidosS } from './admin-pedidos-s';

describe('AdminPedidosS', () => {
  let service: AdminPedidosS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminPedidosS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
