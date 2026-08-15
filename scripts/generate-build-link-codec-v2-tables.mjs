import { DECORATIVE_MODIFICATIONS } from '@elite-dangerous-almanac/core/ships/decorative-modifications';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CODEC_V2_ALMANAC_VERSION = '0.1.0-beta.6';
const outputPath = fileURLToPath(
  new URL('../src/app/domain/build-link/codec-v2.tables.json', import.meta.url),
);
const almanacPackageUrl = new URL(
  '../../package.json',
  import.meta.resolve('@elite-dangerous-almanac/core/ships/decorative-modifications'),
);
const almanacPackage = JSON.parse(await readFile(almanacPackageUrl, 'utf8'));
if (almanacPackage.version !== CODEC_V2_ALMANAC_VERSION) {
  throw new Error(
    `Codec v2 is pinned to Almanac ${CODEC_V2_ALMANAC_VERSION}; refusing to generate it from ${almanacPackage.version}.`,
  );
}

const modifications = Object.keys(DECORATIVE_MODIFICATIONS).sort();

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      $generated: {
        script: 'scripts/generate-build-link-codec-v2-tables.mjs',
        almanacVersion: CODEC_V2_ALMANAC_VERSION,
      },
      CODEC_V2_DECORATIVE_MODIFICATIONS: modifications,
    },
    null,
    2,
  )}\n`,
);
