import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CORE_ARTIFACT_MANIFEST,
  CORE_ARTIFACT_SUMS,
  buildCoreArtifact,
  verifyCoreArtifact,
} from '../scripts/coreArtifactLib.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIRTY_STATE = Object.freeze({ commit: 'a'.repeat(40), dirty: true });
const CLEAN_STATE = Object.freeze({ commit: 'b'.repeat(40), dirty: false });
const CORE_VERSION = '0.3.0-continuity-v1';
const CONTRACT_VERSION = '1.1.0-draft.1';
const RELEASE_FILES = [
  'adapters/hmax/index.js',
  'contracts/runtimeContract.js',
  'core/canonCatalogPolicy.js',
  'core/canonicalCoreAdapter.js',
  'core/continuityPolicy.js',
  'core/emergencePolicy.js',
  'core/sovereignSafetyPolicy.js',
];

test('Core artifact is byte-reproducible for the same source and provenance', async () => {
  await withTemp(async (root) => {
    const first = await buildAt(join(root, 'first'), DIRTY_STATE);
    const second = await buildAt(join(root, 'second'), DIRTY_STATE);
    assert.equal(first.manifest.artifactDigest, second.manifest.artifactDigest);
    assert.equal(first.manifest.releaseEligible, false);
    assert.equal(
      await readFile(join(first.artifactDir, CORE_ARTIFACT_MANIFEST), 'utf8'),
      await readFile(join(second.artifactDir, CORE_ARTIFACT_MANIFEST), 'utf8'),
    );
    assert.equal(
      await readFile(join(first.artifactDir, CORE_ARTIFACT_SUMS), 'utf8'),
      await readFile(join(second.artifactDir, CORE_ARTIFACT_SUMS), 'utf8'),
    );
    const verified = await verify(first);
    assert.equal(verified.ok, true);
    assert.equal(verified.releaseEligible, false);
  });
});

test('Clean source produces a release-eligible artifact and exact runtime handshake', async () => {
  await withTemp(async (root) => {
    const built = await buildAt(join(root, 'artifact'), CLEAN_STATE);
    const dirty = await buildAt(join(root, 'dirty-artifact'), DIRTY_STATE);
    const verified = await verify(built);
    assert.equal(built.manifest.releaseEligible, true);
    assert.notEqual(built.manifest.artifactDigest, dirty.manifest.artifactDigest);
    assert.equal(verified.releaseEligible, true);
    assert.equal(verified.coreVersion, CORE_VERSION);
    assert.equal(verified.contractVersion, CONTRACT_VERSION);
    assert.match(verified.entrypoint, /adapters[\\/]hmax[\\/]index\.js$/u);
  });
});

test('Dirty source fails closed unless explicitly marked as a non-release candidate', async () => {
  await withTemp(async (root) => {
    await assert.rejects(
      () => buildCoreArtifact({ sourceRoot: REPO_ROOT, outputDir: join(root, 'artifact'), sourceState: DIRTY_STATE }),
      (error) => error.code === 'release_source_dirty',
    );
    const built = await buildAt(join(root, 'dirty-artifact'), DIRTY_STATE);
    await assert.rejects(
      () => verifyCoreArtifact({
        artifactDir: built.artifactDir,
        expectedDigest: built.manifest.artifactDigest,
      }),
      (error) => error.code === 'artifact_not_release_eligible',
    );
  });
});

test('Payload tampering, sums tampering and unexpected files are rejected', async () => {
  await withTemp(async (root) => {
    const payload = await buildAt(join(root, 'payload'), DIRTY_STATE);
    await writeFile(join(payload.artifactDir, 'core', 'sovereignSafetyPolicy.js'), '\n// tampered\n', { flag: 'a' });
    await assert.rejects(() => verify(payload), (error) => error.code === 'artifact_file_digest_mismatch');

    const sums = await buildAt(join(root, 'sums'), DIRTY_STATE);
    await writeFile(join(sums.artifactDir, CORE_ARTIFACT_SUMS), '0'.repeat(64) + '  manifest.json\n', 'utf8');
    await assert.rejects(() => verify(sums), (error) => error.code === 'artifact_sums_mismatch');

    const extra = await buildAt(join(root, 'extra'), DIRTY_STATE);
    await writeFile(join(extra.artifactDir, 'unexpected.txt'), 'not allowlisted\n', 'utf8');
    await assert.rejects(() => verify(extra), (error) => error.code === 'artifact_file_set_mismatch');
  });
});

test('Release eligibility and source provenance cannot be relabeled under the same digest pin', async () => {
  await withTemp(async (root) => {
    const built = await buildAt(join(root, 'artifact'), DIRTY_STATE);
    const manifestPath = join(built.artifactDir, CORE_ARTIFACT_MANIFEST);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.sourceDirty = false;
    manifest.releaseEligible = true;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await assert.rejects(
      () => verify(built),
      (error) => error.code === 'artifact_manifest_digest_mismatch',
    );
  });
});

test('Verifier requires an external digest pin and exact Core/contract versions', async () => {
  await withTemp(async (root) => {
    const built = await buildAt(join(root, 'artifact'), DIRTY_STATE);
    await assert.rejects(
      () => verifyCoreArtifact({ artifactDir: built.artifactDir }),
      (error) => error.code === 'artifact_expected_digest_required',
    );
    await assert.rejects(
      () => verifyCoreArtifact({ artifactDir: built.artifactDir, expectedDigest: `sha256:${'0'.repeat(64)}` }),
      (error) => error.code === 'artifact_digest_pin_mismatch',
    );
    await assert.rejects(
      () => verifyCoreArtifact({
        artifactDir: built.artifactDir,
        expectedDigest: built.manifest.artifactDigest,
        expectedCoreVersion: 'other-core',
      }),
      (error) => error.code === 'artifact_core_version_mismatch',
    );
    await assert.rejects(
      () => verifyCoreArtifact({
        artifactDir: built.artifactDir,
        expectedDigest: built.manifest.artifactDigest,
        expectedContractVersion: 'other-contract',
      }),
      (error) => error.code === 'artifact_contract_version_mismatch',
    );
  });
});

test('Builder rejects external imports outside the sealed ESM closure', async () => {
  await withTemp(async (root) => {
    const sourceRoot = join(root, 'source');
    for (const filePath of RELEASE_FILES) {
      const destination = join(sourceRoot, ...filePath.split('/'));
      await mkdir(dirname(destination), { recursive: true });
      await cp(join(REPO_ROOT, ...filePath.split('/')), destination);
    }
    const entrypoint = join(sourceRoot, 'adapters', 'hmax', 'index.js');
    const original = await readFile(entrypoint, 'utf8');
    await writeFile(entrypoint, `import 'node:fs';\n${original}`, 'utf8');
    await assert.rejects(
      () => buildCoreArtifact({
        sourceRoot,
        outputDir: join(root, 'artifact'),
        sourceState: CLEAN_STATE,
      }),
      (error) => error.code === 'artifact_external_import_forbidden',
    );
  });
});

test('Builder rejects comment-obfuscated module syntax before importing source', async () => {
  await withTemp(async (root) => {
    const sourceRoot = join(root, 'source');
    await copyReleaseFiles(sourceRoot);
    const entrypoint = join(sourceRoot, 'adapters', 'hmax', 'index.js');
    const original = await readFile(entrypoint, 'utf8');
    await writeFile(entrypoint, `import/**/'node:fs';\n${original}`, 'utf8');
    await assert.rejects(
      () => buildCoreArtifact({
        sourceRoot,
        outputDir: join(root, 'artifact'),
        sourceState: CLEAN_STATE,
      }),
      (error) => error.code === 'artifact_ambiguous_import_syntax_forbidden',
    );
  });
});

test('Builder rejects source symlinks and junctions inside the allowlisted path', async (context) => {
  await withTemp(async (root) => {
    const sourceRoot = join(root, 'source');
    for (const filePath of RELEASE_FILES.filter((path) => !path.startsWith('core/'))) {
      const destination = join(sourceRoot, ...filePath.split('/'));
      await mkdir(dirname(destination), { recursive: true });
      await cp(join(REPO_ROOT, ...filePath.split('/')), destination);
    }
    await mkdir(sourceRoot, { recursive: true });
    try {
      await symlink(join(REPO_ROOT, 'core'), join(sourceRoot, 'core'), 'junction');
    } catch (error) {
      if (error?.code === 'EPERM' || error?.code === 'EACCES') {
        context.skip(`symlink capability unavailable: ${error.code}`);
        return;
      }
      throw error;
    }
    await assert.rejects(
      () => buildCoreArtifact({
        sourceRoot,
        outputDir: join(root, 'artifact'),
        sourceState: CLEAN_STATE,
      }),
      (error) => error.code === 'release_source_symlink_forbidden',
    );
  });
});

test('Policy and manifest records reject unknown fields', async () => {
  await withTemp(async (root) => {
    const policyPath = join(root, 'policy.json');
    const policy = JSON.parse(await readFile(join(REPO_ROOT, 'release', 'core-artifact-policy.v1.json'), 'utf8'));
    policy.unexpected = true;
    await writeFile(policyPath, `${JSON.stringify(policy, null, 2)}\n`, 'utf8');
    await assert.rejects(
      () => buildCoreArtifact({
        sourceRoot: REPO_ROOT,
        outputDir: join(root, 'policy-artifact'),
        policyPath,
        sourceState: CLEAN_STATE,
      }),
      (error) => error.code === 'release_policy_unknown_field',
    );

    const built = await buildAt(join(root, 'manifest-artifact'), DIRTY_STATE);
    const manifestPath = join(built.artifactDir, CORE_ARTIFACT_MANIFEST);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.files[0].unexpected = true;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await assert.rejects(
      () => verify(built),
      (error) => error.code === 'artifact_file_record_unknown_field',
    );
  });
});

async function buildAt(outputDir, sourceState) {
  return buildCoreArtifact({
    sourceRoot: REPO_ROOT,
    outputDir,
    allowDirty: true,
    sourceState,
  });
}

async function copyReleaseFiles(destinationRoot) {
  for (const filePath of RELEASE_FILES) {
    const destination = join(destinationRoot, ...filePath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(REPO_ROOT, ...filePath.split('/')), destination);
  }
}

function verify(built) {
  return verifyCoreArtifact({
    artifactDir: built.artifactDir,
    expectedDigest: built.manifest.artifactDigest,
    expectedCoreVersion: CORE_VERSION,
    expectedContractVersion: CONTRACT_VERSION,
    allowNonRelease: built.manifest.releaseEligible === false,
  });
}

async function withTemp(action) {
  const root = await mkdtemp(join(tmpdir(), 'raphael-core-artifact-test-'));
  try { return await action(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}
