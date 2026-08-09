import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CORE_ARTIFACT_MANIFEST = 'manifest.json';
export const CORE_ARTIFACT_SUMS = 'SHA256SUMS';
export const DEFAULT_CORE_ARTIFACT_POLICY = fileURLToPath(
  new URL('../release/core-artifact-policy.v1.json', import.meta.url),
);

const MANIFEST_KEYS = new Set([
  'schemaVersion', 'artifactFormat', 'artifactDigest', 'repository',
  'sourceCommit', 'sourceDirty', 'releaseEligible', 'policySha256',
  'coreVersion', 'contractVersion', 'entrypoint', 'requiredExports',
  'authority', 'files',
]);
const FILE_KEYS = new Set(['path', 'sha256', 'bytes']);
const POLICY_KEYS = new Set([
  'schemaVersion', 'artifactFormat', 'repository', 'entrypoint',
  'requiredFiles', 'requiredExports', 'authority',
]);
const AUTHORITY_KEYS = new Set(['modelTrusted', 'directGameMutation', 'tools']);

export async function buildCoreArtifact({
  sourceRoot = process.cwd(),
  outputDir = null,
  policyPath = DEFAULT_CORE_ARTIFACT_POLICY,
  allowDirty = false,
  sourceState = null,
} = {}) {
  const root = resolve(sourceRoot);
  const policy = await loadPolicy(policyPath);
  const gitState = sourceState || readGitState(root);
  validateSourceState(gitState);
  if (gitState.dirty && !allowDirty) fail('release_source_dirty');
  await assertDirectoryRoot(root, 'release_source_root_invalid');

  const sourceFiles = new Map();
  for (const filePath of policy.requiredFiles) {
    const absolutePath = resolveInside(root, filePath);
    await assertNoSymlinkPath(root, filePath, 'release_source_symlink_forbidden');
    const fileStat = await lstat(absolutePath).catch(() => null);
    if (!fileStat?.isFile()) fail('release_source_file_missing', filePath);
    sourceFiles.set(filePath, normalizeSource(await readFile(absolutePath, 'utf8')));
  }
  validateImportClosure(sourceFiles, policy);

  const sourceModule = await importFresh(resolveInside(root, policy.entrypoint));
  const runtime = await validateRuntimeModule(sourceModule, policy);
  const policySha256 = sha256(canonicalJson(policy));
  const files = [...sourceFiles.entries()]
    .map(([path, contents]) => ({
      path,
      sha256: sha256(contents),
      bytes: Buffer.byteLength(contents, 'utf8'),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const manifestPayload = {
    schemaVersion: 'raphael-core-release-manifest:v1',
    artifactFormat: policy.artifactFormat,
    repository: policy.repository,
    sourceCommit: gitState.commit,
    sourceDirty: gitState.dirty,
    releaseEligible: gitState.dirty === false,
    policySha256,
    coreVersion: runtime.coreVersion,
    contractVersion: runtime.contractVersion,
    entrypoint: policy.entrypoint,
    requiredExports: [...policy.requiredExports],
    authority: structuredClone(policy.authority),
    files,
  };
  const artifactDigest = digestArtifact(manifestPayload);
  const manifest = {
    ...manifestPayload,
    artifactDigest,
  };

  const artifactDir = resolve(outputDir || join(process.cwd(), 'dist', 'raphael-core', safeSegment(runtime.coreVersion)));
  await requireEmptyOutput(artifactDir);
  for (const [filePath, contents] of sourceFiles) {
    const destination = resolveInside(artifactDir, filePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, 'utf8');
  }
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(artifactDir, CORE_ARTIFACT_MANIFEST), manifestText, 'utf8');
  const sums = [
    ...files.map((file) => `${file.sha256}  ${file.path}`),
    `${sha256(manifestText)}  ${CORE_ARTIFACT_MANIFEST}`,
  ].sort().join('\n');
  await writeFile(join(artifactDir, CORE_ARTIFACT_SUMS), `${sums}\n`, 'utf8');

  return Object.freeze({ artifactDir, manifest: deepFreeze(manifest) });
}

export async function verifyCoreArtifact({
  artifactDir,
  expectedDigest,
  expectedCoreVersion = null,
  expectedContractVersion = null,
  allowNonRelease = false,
  policyPath = DEFAULT_CORE_ARTIFACT_POLICY,
} = {}) {
  if (typeof artifactDir !== 'string' || artifactDir.trim() === '') fail('artifact_dir_required');
  if (typeof expectedDigest !== 'string' || !/^sha256:[a-f0-9]{64}$/u.test(expectedDigest)) {
    fail('artifact_expected_digest_required');
  }
  const root = resolve(artifactDir);
  const policy = await loadPolicy(policyPath);
  const actualFiles = await listArtifactFiles(root);
  const manifestText = await readFile(join(root, CORE_ARTIFACT_MANIFEST), 'utf8').catch(() => fail('artifact_manifest_missing'));
  let manifest;
  try { manifest = JSON.parse(manifestText); } catch { fail('artifact_manifest_invalid'); }
  assertExactKeys(manifest, MANIFEST_KEYS, 'artifact_manifest_unknown_field');
  validateManifest(manifest, policy);
  if (manifest.artifactDigest !== expectedDigest) fail('artifact_digest_pin_mismatch');
  if (expectedCoreVersion && manifest.coreVersion !== expectedCoreVersion) fail('artifact_core_version_mismatch');
  if (expectedContractVersion && manifest.contractVersion !== expectedContractVersion) fail('artifact_contract_version_mismatch');
  if (manifest.releaseEligible !== true && allowNonRelease !== true) fail('artifact_not_release_eligible');

  const expectedFiles = new Set([...policy.requiredFiles, CORE_ARTIFACT_MANIFEST, CORE_ARTIFACT_SUMS]);
  if (actualFiles.length !== expectedFiles.size || actualFiles.some((file) => !expectedFiles.has(file))) {
    fail('artifact_file_set_mismatch');
  }

  const sourceFiles = new Map();
  for (const record of manifest.files) {
    const absolutePath = resolveInside(root, record.path);
    const contents = await readFile(absolutePath, 'utf8').catch(() => fail('artifact_file_missing', record.path));
    if (sha256(contents) !== record.sha256 || Buffer.byteLength(contents, 'utf8') !== record.bytes) {
      fail('artifact_file_digest_mismatch', record.path);
    }
    sourceFiles.set(record.path, contents);
  }
  validateImportClosure(sourceFiles, policy);

  const { artifactDigest: ignoredDigest, ...manifestPayload } = manifest;
  const recomputed = digestArtifact(manifestPayload);
  if (recomputed !== manifest.artifactDigest) fail('artifact_manifest_digest_mismatch');

  const expectedSums = [
    ...manifest.files.map((file) => `${file.sha256}  ${file.path}`),
    `${sha256(manifestText)}  ${CORE_ARTIFACT_MANIFEST}`,
  ].sort().join('\n') + '\n';
  const actualSums = await readFile(join(root, CORE_ARTIFACT_SUMS), 'utf8').catch(() => fail('artifact_sums_missing'));
  if (actualSums !== expectedSums) fail('artifact_sums_mismatch');

  const runtimeModule = await importFresh(resolveInside(root, manifest.entrypoint));
  const runtime = await validateRuntimeModule(runtimeModule, policy);
  if (runtime.coreVersion !== manifest.coreVersion || runtime.contractVersion !== manifest.contractVersion) {
    fail('artifact_runtime_version_mismatch');
  }
  return deepFreeze({
    ok: true,
    artifactDir: root,
    artifactDigest: manifest.artifactDigest,
    coreVersion: manifest.coreVersion,
    contractVersion: manifest.contractVersion,
    releaseEligible: manifest.releaseEligible,
    entrypoint: resolveInside(root, manifest.entrypoint),
  });
}

export function readGitState(sourceRoot) {
  const options = { cwd: sourceRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], options).trim();
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], options).trim().length > 0;
    return { commit, dirty };
  } catch {
    fail('release_source_git_state_unavailable');
  }
}

export function digestArtifact(value) {
  return `sha256:${sha256(canonicalJson(value))}`;
}

function validateSourceState(value) {
  if (!value || !/^[a-f0-9]{40}$/u.test(value.commit) || typeof value.dirty !== 'boolean') {
    fail('release_source_git_state_invalid');
  }
}

async function loadPolicy(policyPath) {
  let policy;
  try { policy = JSON.parse(await readFile(resolve(policyPath), 'utf8')); }
  catch { fail('release_policy_invalid'); }
  assertExactKeys(policy, POLICY_KEYS, 'release_policy_unknown_field');
  assertExactKeys(policy.authority, AUTHORITY_KEYS, 'release_policy_authority_unknown_field');
  if (policy?.schemaVersion !== 'raphael-core-release-policy:v1'
    || policy?.artifactFormat !== 'raphael-core-esm-directory:v1'
    || typeof policy.repository !== 'string'
    || !isSafeRelativePath(policy.entrypoint)
    || !Array.isArray(policy.requiredFiles)
    || !Array.isArray(policy.requiredExports)
    || policy.requiredFiles.length === 0
    || new Set(policy.requiredFiles).size !== policy.requiredFiles.length
    || !policy.requiredFiles.includes(policy.entrypoint)
    || policy.requiredFiles.some((file) => !isSafeRelativePath(file))
    || policy.requiredExports.some((name) => typeof name !== 'string' || !name)) {
    fail('release_policy_invalid');
  }
  if (policy.authority?.modelTrusted !== false
    || policy.authority?.directGameMutation !== false
    || !Array.isArray(policy.authority?.tools)
    || policy.authority.tools.length !== 0) fail('release_policy_authority_invalid');
  return policy;
}

async function validateRuntimeModule(runtimeModule, policy) {
  for (const exportName of policy.requiredExports) {
    if (!(exportName in runtimeModule)) fail('artifact_required_export_missing', exportName);
  }
  if (typeof runtimeModule.finalizeCandidate !== 'function'
    || typeof runtimeModule.safetyPreflight !== 'function'
    || typeof runtimeModule.health !== 'function'
    || typeof runtimeModule.coreVersion !== 'string'
    || typeof runtimeModule.contractVersion !== 'string') fail('artifact_runtime_exports_invalid');
  const health = await runtimeModule.health();
  if (health?.ok !== true
    || health.coreVersion !== runtimeModule.coreVersion
    || health.contractVersion !== runtimeModule.contractVersion
    || health.modelAuthority !== false
    || health.directGameMutation !== false) fail('artifact_runtime_health_invalid');
  return { coreVersion: runtimeModule.coreVersion, contractVersion: runtimeModule.contractVersion };
}

function validateManifest(manifest, policy) {
  if (!Array.isArray(manifest.files)) fail('artifact_manifest_policy_mismatch');
  for (const record of manifest.files) {
    assertExactKeys(record, FILE_KEYS, 'artifact_file_record_unknown_field');
    if (!isSafeRelativePath(record.path)
      || !/^[a-f0-9]{64}$/u.test(record.sha256)
      || !Number.isSafeInteger(record.bytes)
      || record.bytes < 0) fail('artifact_file_record_invalid', record.path);
  }
  if (manifest.schemaVersion !== 'raphael-core-release-manifest:v1'
    || manifest.artifactFormat !== policy.artifactFormat
    || manifest.repository !== policy.repository
    || manifest.entrypoint !== policy.entrypoint
    || manifest.policySha256 !== sha256(canonicalJson(policy))
    || !/^[a-f0-9]{40}$/u.test(manifest.sourceCommit)
    || typeof manifest.sourceDirty !== 'boolean'
    || manifest.releaseEligible !== !manifest.sourceDirty
    || typeof manifest.coreVersion !== 'string'
    || typeof manifest.contractVersion !== 'string'
    || !Array.isArray(manifest.requiredExports)
    || canonicalJson(manifest.requiredExports) !== canonicalJson(policy.requiredExports)
    || canonicalJson(manifest.authority) !== canonicalJson(policy.authority)
    || !Array.isArray(manifest.files)
    || canonicalJson(manifest.files.map((file) => file.path)) !== canonicalJson([...policy.requiredFiles].sort())) {
    fail('artifact_manifest_policy_mismatch');
  }
}

function validateImportClosure(sourceFiles, policy) {
  const graph = new Map();
  for (const [filePath, contents] of sourceFiles) {
    if (/\bimport(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*(?:\r?\n|$))*\(/u.test(contents)) {
      fail('artifact_dynamic_import_forbidden', filePath);
    }
    if (/\b(?:import|export|from)\s*\/[/*]/u.test(contents)) {
      fail('artifact_ambiguous_import_syntax_forbidden', filePath);
    }
    const specifiers = extractImportSpecifiers(contents);
    const resolved = [];
    for (const specifier of specifiers) {
      if (!specifier.startsWith('.')) fail('artifact_external_import_forbidden', `${filePath}:${specifier}`);
      const target = posix.normalize(posix.join(posix.dirname(filePath), specifier));
      if (!policy.requiredFiles.includes(target)) fail('artifact_import_outside_closure', `${filePath}:${specifier}`);
      resolved.push(target);
    }
    graph.set(filePath, resolved);
  }
  const reachable = new Set();
  const pending = [policy.entrypoint];
  while (pending.length) {
    const filePath = pending.pop();
    if (reachable.has(filePath)) continue;
    reachable.add(filePath);
    for (const imported of graph.get(filePath) || []) pending.push(imported);
  }
  if (reachable.size !== policy.requiredFiles.length) fail('artifact_unreachable_source_file');
}

function extractImportSpecifiers(contents) {
  const values = [];
  const patterns = [
    /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gu,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of contents.matchAll(pattern)) values.push(match[1]);
  }
  return [...new Set(values)];
}

async function listArtifactFiles(root) {
  await assertDirectoryRoot(root, 'artifact_root_invalid');
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isSymbolicLink()) fail('artifact_symlink_forbidden');
      if (entry.isDirectory()) await visit(absolutePath);
      else if (entry.isFile()) files.push(relative(root, absolutePath).split(sep).join('/'));
      else fail('artifact_special_file_forbidden');
    }
  }
  await visit(root);
  return files.sort();
}

async function assertDirectoryRoot(root, code) {
  const rootStat = await lstat(root).catch(() => null);
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) fail(code);
}

async function assertNoSymlinkPath(root, filePath, code) {
  let current = resolve(root);
  const segments = filePath.split('/');
  for (let index = 0; index < segments.length; index += 1) {
    current = join(current, segments[index]);
    const entry = await lstat(current).catch(() => null);
    if (!entry) fail('release_source_file_missing', filePath);
    if (entry.isSymbolicLink()) fail(code, filePath);
    const final = index === segments.length - 1;
    if ((!final && !entry.isDirectory()) || (final && !entry.isFile())) {
      fail('release_source_file_missing', filePath);
    }
  }
}

async function requireEmptyOutput(outputDir) {
  const existing = await readdir(outputDir).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  if (existing?.length) fail('artifact_output_not_empty');
  await mkdir(outputDir, { recursive: true });
}

function resolveInside(root, filePath) {
  if (!isSafeRelativePath(filePath)) fail('artifact_path_invalid', filePath);
  const absoluteRoot = resolve(root);
  const absolutePath = resolve(absoluteRoot, filePath);
  const prefix = `${absoluteRoot}${sep}`;
  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(prefix)) fail('artifact_path_escape', filePath);
  return absolutePath;
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || !value || isAbsolute(value) || value.includes('\\')) return false;
  const normalized = posix.normalize(value);
  return normalized === value && !normalized.startsWith('../') && normalized !== '..';
}

function safeSegment(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9._-]{1,128}$/u.test(value)) fail('artifact_version_path_invalid');
  return value;
}

function normalizeSource(value) {
  return String(value).replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n').replace(/\n*$/u, '\n');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function importFresh(filePath) {
  const url = pathToFileURL(filePath);
  url.searchParams.set('artifactCheck', randomUUID());
  try { return await import(url.href); }
  catch (error) { fail('artifact_runtime_import_failed', error?.code || error?.message); }
}

function assertExactKeys(value, allowed, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(code, key);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function fail(code, details = null) {
  const error = new Error(details ? `${code}:${details}` : code);
  error.code = code;
  error.details = details;
  throw error;
}
