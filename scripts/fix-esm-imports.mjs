import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

function shouldAppendJs(specifier) {
  if (!specifier.startsWith('.')) return false;
  if (specifier.endsWith('/')) return false;
  if (specifier.includes('?') || specifier.includes('#')) return false;
  return !/\.(js|mjs|cjs|json|node)$/.test(specifier);
}

function rewriteImports(code) {
  const fromPattern = /(from\s+['"])([^'"]+)(['"])/g;
  const dynamicPattern = /(import\(\s*['"])([^'"]+)(['"]\s*\))/g;

  let updated = code.replace(fromPattern, (full, prefix, specifier, suffix) => {
    if (!shouldAppendJs(specifier)) return full;
    return `${prefix}${specifier}.js${suffix}`;
  });

  updated = updated.replace(dynamicPattern, (full, prefix, specifier, suffix) => {
    if (!shouldAppendJs(specifier)) return full;
    return `${prefix}${specifier}.js${suffix}`;
  });

  return updated;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith('.js')) {
      continue;
    }

    const original = fs.readFileSync(fullPath, 'utf8');
    const rewritten = rewriteImports(original);
    if (rewritten !== original) {
      fs.writeFileSync(fullPath, rewritten, 'utf8');
    }
  }
}

if (fs.existsSync(distDir)) {
  walk(distDir);
}
