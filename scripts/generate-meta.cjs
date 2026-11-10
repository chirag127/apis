
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../api/v1/data.json'), 'utf8'));
const meta = {
  status: 'healthy',
  lastUpdated: new Date().toISOString(),
  sourceUpdatedAt: '2026-11-04T12:04:13.000Z',
  retrievedAt: new Date().toISOString(),
  recordCount: data.length,
  version: '1.0.0',
  schemaVersion: '1.0.0',
  source: 'Google libphonenumber PhoneNumberMetadata.xml, CLDR territory names',
  sourceUrl: 'https://raw.githubusercontent.com/google/libphonenumber/master/resources/PhoneNumberMetadata.xml',
  license: 'Apache-2.0 (libphonenumber); Unicode License v3 (CLDR)',
  updateCadence: 'quarterly',
  nextUpdateDue: new Date(Date.now() + 90*24*60*60*1000).toISOString(),
  lastFailedAt: null,
  failureReason: null
};
fs.writeFileSync(path.join(__dirname, '../api/v1/meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log('Generated meta.json');
