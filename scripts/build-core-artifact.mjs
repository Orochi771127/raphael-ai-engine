import { resolve } from 'node:path';
import { buildCoreArtifact } from './coreArtifactLib.mjs';

const options = parseArgs(process.argv.slice(2));
const result = await buildCoreArtifact({
  sourceRoot: options.sourceRoot || process.cwd(),
  outputDir: options.outputDir || null,
  allowDirty: options.allowDirty || process.env.RAPHAEL_RELEASE_ALLOW_DIRTY === '1',
});

console.log(JSON.stringify({
  ok: true,
  artifactDir: result.artifactDir,
  artifactDigest: result.manifest.artifactDigest,
  coreVersion: result.manifest.coreVersion,
  contractVersion: result.manifest.contractVersion,
  releaseEligible: result.manifest.releaseEligible,
}, null, 2));

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--allow-dirty') result.allowDirty = true;
    else if (value === '--source-root') result.sourceRoot = resolve(requireValue(args, ++index, value));
    else if (value === '--output') result.outputDir = resolve(requireValue(args, ++index, value));
    else throw new Error(`unknown_argument:${value}`);
  }
  return result;
}

function requireValue(args, index, option) {
  if (!args[index] || args[index].startsWith('--')) throw new Error(`missing_argument:${option}`);
  return args[index];
}
