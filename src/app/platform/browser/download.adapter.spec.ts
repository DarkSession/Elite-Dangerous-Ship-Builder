import { TestBed } from '@angular/core/testing';
import { DownloadAdapter } from './download.adapter';

describe('DownloadAdapter', () => {
  let adapter: DownloadAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(DownloadAdapter);
  });

  it('dispatches exactly the payload bytes under the given name and type', () => {
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoked = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let clicked: { href: string; download: string } | null = null;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = { href: this.href, download: this.download };
    });

    expect(adapter.dispatch('[]', 'build.slef.json', 'application/json;charset=utf-8')).toBe(true);

    expect(created).toHaveBeenCalledTimes(1);
    const blob = created.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('application/json;charset=utf-8');
    expect(blob.size).toBe(2);
    expect(clicked).toEqual({ href: 'blob:test', download: 'build.slef.json' });

    created.mockRestore();
    revoked.mockRestore();
    click.mockRestore();
  });

  it('revokes the object URL and removes the anchor, even when the click throws', async () => {
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoked = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(adapter.dispatch('[]', 'build.slef.json', 'application/json')).toBe(false);

    // The anchor goes at once; the object URL goes on the next task, so the
    // browser is not reading a URL that has already been revoked.
    expect(document.body.querySelector('a[download]')).toBeNull();
    expect(revoked).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(revoked).toHaveBeenCalledWith('blob:test');

    created.mockRestore();
    revoked.mockRestore();
    click.mockRestore();
  });

  it('reports a setup failure rather than throwing when the URL cannot be made', () => {
    const created = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('no');
    });

    expect(adapter.dispatch('[]', 'build.slef.json', 'application/json')).toBe(false);

    created.mockRestore();
  });

  it('builds a File carrying the same bytes for the share sheet', async () => {
    const file = adapter.toFile('[]', 'build.slef.json', 'application/json;charset=utf-8');

    expect(file).not.toBeNull();
    expect(file?.name).toBe('build.slef.json');
    expect(file?.type).toBe('application/json;charset=utf-8');
    expect(await file?.text()).toBe('[]');
  });
});
