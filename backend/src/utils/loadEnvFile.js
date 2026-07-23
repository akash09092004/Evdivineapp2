const fs = require('fs');
const path = require('path');

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const index = trimmed.indexOf('=');
  if (index === -1) return null;
  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
};

const loadEnvFile = (envPath) => {
  const candidatePaths = [
    envPath,
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env')
  ].filter(Boolean);

  const filePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!filePath) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = {};

  content.split(/\r?\n/).forEach((line) => {
    const entry = parseEnvLine(line);
    if (!entry) return;
    if (typeof process.env[entry.key] === 'undefined') {
      process.env[entry.key] = entry.value;
    }
    parsed[entry.key] = entry.value;
  });

  return parsed;
};

module.exports = { loadEnvFile };
