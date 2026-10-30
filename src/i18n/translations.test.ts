import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from './translations';

test('i18n translations have complete keys in both vi and en', () => {
  const vi = translations.vi;
  const en = translations.en;

  assert.ok(vi);
  assert.ok(en);

  // Check top level sections
  const sections = Object.keys(vi) as Array<keyof typeof vi>;
  for (const section of sections) {
    assert.ok(en[section], `Missing section ${section} in en`);
    const viKeys = Object.keys(vi[section]) as Array<keyof typeof vi[typeof section]>;
    for (const key of viKeys) {
      assert.ok(
        (en[section] as any)[key],
        `Missing key ${String(key)} in section ${section} in en`
      );
      assert.ok(
        typeof (vi[section] as any)[key] === 'string' && (vi[section] as any)[key].length > 0,
        `Empty string in vi.${section}.${String(key)}`
      );
      assert.ok(
        typeof (en[section] as any)[key] === 'string' && (en[section] as any)[key].length > 0,
        `Empty string in en.${section}.${String(key)}`
      );
    }
  }
});
