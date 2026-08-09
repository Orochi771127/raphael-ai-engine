import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCoreArtifact, verifyCoreArtifact } from './coreArtifactLib.mjs';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'raphael-core-release-check-'));
try {
  const built = await buildCoreArtifact({
    sourceRoot: process.cwd(),
    outputDir: join(temporaryRoot, 'artifact'),
    allowDirty: process.env.RAPHAEL_RELEASE_ALLOW_DIRTY === '1',
  });
  const verified = await verifyCoreArtifact({
    artifactDir: built.artifactDir,
    expectedDigest: built.manifest.artifactDigest,
    expectedCoreVersion: built.manifest.coreVersion,
    expectedContractVersion: built.manifest.contractVersion,
    allowNonRelease: built.manifest.releaseEligible === false
      && process.env.RAPHAEL_RELEASE_ALLOW_DIRTY === '1',
  });
  console.log(JSON.stringify({
    ok: true,
    reproducibleFormat: built.manifest.artifactFormat,
    artifactDigest: verified.artifactDigest,
    coreVersion: verified.coreVersion,
    contractVersion: verified.contractVersion,
    releaseEligible: verified.releaseEligible,
  }, null, 2));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
