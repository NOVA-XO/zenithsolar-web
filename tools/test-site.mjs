import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const names = ['index.html', 'privacy.html', 'accessibility.html', '404.html'];
const pages = new Map(await Promise.all(names.map(async name => [name, await fs.readFile(path.join(root, name), 'utf8')])));
const identifiers = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

test('all local links, images, stylesheets and fragment targets exist', async () => {
  for (const [name, html] of pages) {
    const ids = identifiers(html);
    assert.equal(new Set(ids).size, ids.length, `${name}: duplicate id`);
    for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|tel:|data:)/.test(value)) continue;
      const url = new URL(value.replaceAll('&amp;', '&'), 'https://example.test/zenithsolar-web/' + name);
      const target = url.pathname.replace(/^\/zenithsolar-web\//, '') || 'index.html';
      await fs.access(path.join(root, target));
      if (url.hash && target.endsWith('.html')) assert.ok(identifiers(pages.get(target)).includes(url.hash.slice(1)), `${name}: ${value}`);
    }
    for (const [, value] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
      for (const item of value.split(',')) await fs.access(path.join(root, item.trim().split(/\s+/)[0]));
    }
  }
});
test('homepage discloses draft behavior and cannot submit without its script', () => {
  const html = pages.get('index.html');
  assert.match(html, /<form[^>]+id="enquiry-form"[^>]+hidden/);
  assert.match(html, /<button[^>]+type="submit"[^>]+disabled/);
  assert.match(html, /Энэ товч хүсэлт илгээхгүй/);
  assert.match(pages.get('privacy.html'), /серверт илгээхгүй, хадгалахгүй/);
});
test('power design is the main service and LineWorks requirements agree', () => {
  const html = pages.get('index.html');
  assert.match(html, /id="hero-title">Эрчим хүчний <em>зураг төсөл/);
  assert.match(html, /TPM 2\.0/);
  assert.match(html, /7 хоног тутмын онлайн шалгалт/);
  assert.doesNotMatch(html, /Интернэтгүй ажиллана|удахгүй нэмнэ/);
});
test('gallery controls and enquiry fields have valid accessibility targets', () => {
  const html = pages.get('index.html');
  const ids = identifiers(html);
  for (const id of ['gallery', 'gallery-status', 'gallery-more', 'lightbox-prev', 'lightbox-next', 'lightbox-caption', 'lightbox-count', 'enquiry-form', 'enquiry-draft']) assert.ok(ids.includes(id), id);
  for (const [, label] of html.matchAll(/<label[^>]+for="([^"]+)"/g)) assert.ok(ids.includes(label), label);
  assert.equal((html.match(/data-service="/g) || []).length, 6);
});
test('new module imports resolve and site code does not submit enquiry data', async () => {
  const js = await fs.readFile(path.join(root, 'assets/site.js'), 'utf8');
  assert.match(js, /from ["']\.\/enquiry\.js["']/);
  await fs.access(path.join(root, 'assets/enquiry.js'));
  assert.doesNotMatch(js, /\bfetch\(|XMLHttpRequest|sendBeacon|localStorage\.setItem|\.submit\(/);
});
