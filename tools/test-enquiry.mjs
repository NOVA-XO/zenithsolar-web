import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEnquiry, CONTACT_EMAIL } from '../assets/enquiry.js';

const request = { service: 'external', location: 'Улаанбаатар', details: 'Гадна цахилгаан хангамжийн зураг төсөл хэрэгтэй.' };
test('draft uses the selected service and preserves Mongolian text', () => {
  const draft = buildEnquiry({ ...request, name: '  Жишээ ХХК  ', contact: ' example@example.com ' });
  assert.equal(draft.subject, 'Төслийн хүсэлт — Гадна цахилгааны зураг төсөл');
  assert.match(draft.body, /Байршил: Улаанбаатар/);
  assert.match(draft.body, /Нэр \/ байгууллага: Жишээ ХХК/);
  assert.match(draft.body, /Холбоо барих: example@example.com/);
});
test('optional personal fields can be omitted', () => {
  const draft = buildEnquiry(request);
  assert.doesNotMatch(draft.body, /undefined|Нэр \/ байгууллага:|Холбоо барих:/);
});
test('unknown services and blank required fields are rejected', () => {
  for (const service of ['', 'constructor', '__proto__', 'unknown']) assert.throws(() => buildEnquiry({ ...request, service }));
  assert.throws(() => buildEnquiry({ ...request, location: '  ' }), /байршлыг/);
  assert.throws(() => buildEnquiry({ ...request, details: ' богино ' }), /дэлгэрэнгүй/);
});
test('draft enforces field lengths even when browser constraints are bypassed', () => {
  for (const [field, length] of [['location', 161], ['details', 2001], ['name', 121], ['contact', 161]]) {
    assert.throws(() => buildEnquiry({ ...request, [field]: 'a'.repeat(length) }), /зөвшөөрсөн уртад/);
  }
});
test('user text cannot inject another mail recipient or subject', () => {
  const text = 'Тест &subject=өөр&cc=other@example.com\n<img src=x>';
  const draft = buildEnquiry({ ...request, details: text });
  const link = new URL(draft.mailto);
  assert.equal(link.pathname, CONTACT_EMAIL);
  assert.deepEqual([...link.searchParams.keys()], ['subject', 'body']);
  assert.ok(link.searchParams.get('body').includes(text));
  assert.equal(link.searchParams.get('subject'), draft.subject);
});
test('long drafts remain copyable without exposing an overlong mailto action', () => {
  const draft = buildEnquiry({ ...request, details: 'Тайлбар '.repeat(200) });
  assert.equal(draft.canOpenEmail, false);
  assert.ok(draft.body.includes('Тайлбар'));
  assert.equal(buildEnquiry({ service: 'other', location: 'UB', details: 'Test project request' }).canOpenEmail, true);
});
