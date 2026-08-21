import { TestBed } from '@angular/core/testing';
import { ConnectivityAdapter } from './connectivity.adapter';

function adapter(): ConnectivityAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ConnectivityAdapter);
}

describe('ConnectivityAdapter', () => {
  it('follows the browser’s own connectivity transitions', () => {
    const port = adapter();

    window.dispatchEvent(new Event('offline'));
    expect(port.online()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(port.online()).toBe(true);
  });

  it('calls a retry listener when connectivity returns, until unsubscribed', () => {
    const port = adapter();
    let retries = 0;
    const unsubscribe = port.onOnline(() => (retries += 1));

    window.dispatchEvent(new Event('online'));
    expect(retries).toBe(1);

    unsubscribe();
    window.dispatchEvent(new Event('online'));
    expect(retries).toBe(1);
  });
});
