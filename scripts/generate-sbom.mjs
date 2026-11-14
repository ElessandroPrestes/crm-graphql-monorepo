import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv.indexOf('--output');
const output = resolve(
  root,
  outputArg >= 0 && process.argv[outputArg + 1]
    ? process.argv[outputArg + 1]
    : 'test-results/sbom/nexo-crm.cdx.json',
);

const rootPackage = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const raw = execFileSync('pnpm', ['-r', 'licenses', 'list', '--json', '--long'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const licenseGroups = JSON.parse(raw);
const seen = new Set();
const components = [];

for (const [license, packages] of Object.entries(licenseGroups)) {
  for (const pkg of packages) {
    for (const version of pkg.versions ?? []) {
      const key = `${pkg.name}@${version}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      components.push(component(pkg.name, version, license, pkg.homepage));
    }
  }
}

components.sort((left, right) => left['bom-ref'].localeCompare(right['bom-ref']));

const rootRef = `${rootPackage.name}@${rootPackage.version}`;
const digest = createHash('sha256').update(JSON.stringify(components)).digest('hex');
const serialNumber = `urn:uuid:${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
const pmVersion = String(rootPackage.packageManager ?? 'pnpm')
  .split('@')
  .pop();

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: {
      components: [{ type: 'application', name: 'pnpm', version: pmVersion }],
    },
    component: {
      type: 'application',
      'bom-ref': rootRef,
      name: rootPackage.name,
      version: rootPackage.version,
      description: rootPackage.description,
      licenses: [{ license: { id: 'MIT' } }],
    },
  },
  components,
  dependencies: [
    {
      ref: rootRef,
      dependsOn: components.map((item) => item['bom-ref']),
    },
  ],
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(sbom, null, 2)}\n`);

console.log(`SBOM CycloneDX com ${components.length} componentes: ${output}`);

function component(name, version, license, homepage) {
  const ref = purl(name, version);
  const result = {
    type: 'library',
    'bom-ref': ref,
    name,
    version,
    purl: ref,
    licenses: [licenseEntry(license)],
  };

  if (isUrl(homepage)) {
    result.externalReferences = [{ type: 'website', url: homepage }];
  }

  return result;
}

function licenseEntry(license) {
  if (/^[A-Za-z0-9.+-]+$/.test(license) && license !== 'Unknown') {
    return { license: { id: license } };
  }

  if (/\s(AND|OR|WITH)\s/.test(license)) {
    return { expression: license };
  }

  return { license: { name: license } };
}

function purl(name, version) {
  const encodedVersion = encodeURIComponent(version);

  if (name.startsWith('@')) {
    const [scope, packageName] = name.slice(1).split('/');

    return `pkg:npm/%40${encodeURIComponent(scope)}/${encodeURIComponent(packageName)}@${encodedVersion}`;
  }

  return `pkg:npm/${encodeURIComponent(name)}@${encodedVersion}`;
}

function isUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
