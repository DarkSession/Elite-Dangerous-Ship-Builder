/**
 * The two parts of the brand pipeline that are not a screenshot.
 *
 * Everything else the generator does is Chromium drawing a page, which is
 * checked by looking at it. These two are a binary container and a text edit,
 * and both fail quietly: a wrong offset in the icon leaves a file Chromium
 * still renders from its first entry and Firefox drops, and a metadata strip
 * that matched nothing ships a mark that is nine parts provenance to one part
 * drawing. Neither shows up in a build.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { BAR_MARK, ICO_SIZES, drawingOnly, packIcon } from './generate-brand-assets.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A payload that is not a real PNG, because the container never reads one. */
const payload = (size) => Buffer.alloc(size, 7);

describe('packIcon', () => {
  it('addresses every entry at the offset and length its payload actually has', () => {
    const entries = [
      { size: 48, bytes: payload(300) },
      { size: 32, bytes: payload(120) },
      { size: 16, bytes: payload(64) },
    ];

    const ico = packIcon(entries);

    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1, 'type 1 is an icon');
    assert.equal(ico.readUInt16LE(4), entries.length);
    assert.equal(ico.length, 6 + entries.length * 16 + 300 + 120 + 64);

    entries.forEach(({ size, bytes }, index) => {
      const at = 6 + index * 16;
      assert.equal(ico.readUInt8(at), size, 'width');
      assert.equal(ico.readUInt8(at + 1), size, 'height');
      assert.equal(ico.readUInt16LE(at + 4), 1, 'one colour plane');
      assert.equal(ico.readUInt16LE(at + 6), 32, 'bits per pixel');

      const length = ico.readUInt32LE(at + 8);
      const offset = ico.readUInt32LE(at + 12);
      assert.equal(length, bytes.length);
      assert.deepEqual(ico.subarray(offset, offset + length), bytes);
    });
  });

  it('writes a 256-pixel entry as the zero the format reserves for it', () => {
    const ico = packIcon([{ size: 256, bytes: payload(8) }]);

    assert.equal(ico.readUInt8(6), 0);
    assert.equal(ico.readUInt8(7), 0);
  });

  it('packs the committed favicon at the sizes the generator asks for', async () => {
    const ico = await readFile(join(ROOT, 'public/favicon.ico'));

    assert.equal(ico.readUInt16LE(4), ICO_SIZES.length);
    for (const [index, size] of ICO_SIZES.entries()) {
      const at = 6 + index * 16;
      assert.equal(ico.readUInt8(at), size);
      const offset = ico.readUInt32LE(at + 12);
      assert.deepEqual(
        ico.subarray(offset, offset + PNG_SIGNATURE.length),
        PNG_SIGNATURE,
        `the ${size}-pixel entry points at a PNG`,
      );
    }
  });
});

describe('drawingOnly', () => {
  it('takes the provenance manifest out and leaves the drawing', () => {
    const stripped = drawingOnly(
      '<svg xmlns:c2pa="http://c2pa.org/manifest" fill="none"><metadata><c2pa:manifest>AAAA</c2pa:manifest></metadata>\n  <path d="M0,0" /></svg>',
    );

    assert.equal(stripped, '<svg fill="none"><path d="M0,0" /></svg>');
  });

  it('leaves a drawing that carries no manifest exactly as it is', () => {
    const drawing = '<svg viewBox="0 0 1 1"><path d="M0,0" /></svg>';

    assert.equal(drawingOnly(drawing), drawing);
  });

  it('ships the design’s own drawing, and only the drawing', async () => {
    const [exported, shipped] = await Promise.all([
      readFile(join(ROOT, BAR_MARK.source), 'utf8'),
      readFile(join(ROOT, BAR_MARK.file), 'utf8'),
    ]);

    assert.equal(shipped, drawingOnly(exported), 'the shipped mark is the exported one, stripped');
    assert.ok(!shipped.includes('c2pa'), 'no provenance manifest is prefetched into the shell');
    assert.ok(shipped.includes('rotate(-10 60 60)'), 'and the beacon is still drawn');
  });
});
