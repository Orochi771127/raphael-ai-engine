import { resolve } from 'node:path';
import { verifyCoreArtifact } from './coreArtifactLib.mjs';

const options = parseArgs(process.argv.slice(2));
const result = await verifyCoreArtifact(options);
console.log(JSON.stringify(result, null, 2));

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--artifact') result.artifactDir = resolve(requireValue(args, ++index, value));
    else if (value === '--allow-non-release') result.allowNonRelease = true;
    else if (value === '--expected-digest') result.expectedDigest = requireValue(args, ++index, value);
    else if (value === '--expected-core-version') result.expectedCoreVersion = requireValue(args, ++index, value);
    else if (value === '--expected-contract-version') result.expectedContractVersion = requireValue(args, ++index, value);
    else throw new Error(`unknown_argument:${value}`);
  }
  return result;
}

function requireValue(args, index, option) {
  if (!args[index] || args[index].startsWith('--')) throw new Error(`missing_argument:${option}`);
  return args[index];
}
