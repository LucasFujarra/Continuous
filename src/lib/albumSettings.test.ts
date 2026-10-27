import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorLuminance, contrastingText, defaultAlbumColor, hexToHsv, hsvToHex, loadAlbumPreferences } from './albumSettings.ts';

test('converte cores entre hexadecimal e a roda sem perder a cor escolhida', () => {
  for (const color of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#8b81e4', '#123abc']) {
    const hsv = hexToHsv(color);
    assert.equal(hsvToHex(hsv.hue, hsv.saturation, hsv.value), color);
  }
  assert.equal(defaultAlbumColor(0), '#81e4c3');
});

test('restaura somente títulos e cores válidos e tolera cache corrompido', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let stored = JSON.stringify({ Angel: { color: '#123abc' }, Warm: { title: 'Meu álbum', color: 'invalid' } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => stored } });
  try {
    const restored = loadAlbumPreferences();
    assert.equal(restored.Angel.color, '#123abc');
    assert.equal(restored.Warm.title, 'Meu álbum');
    assert.equal(restored.Warm.color, undefined);
    stored = '{broken';
    assert.deepEqual(loadAlbumPreferences(), {});
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('mantém contraste legível nos botões para cores claras e escuras', () => {
  assert.equal(contrastingText('#000000'), '#ffffff');
  assert.equal(contrastingText('#121026'), '#ffffff');
  assert.equal(contrastingText('#ffffff'), '#000000');
  assert.equal(contrastingText('#ffff00'), '#000000');
  for (const color of ['#000000', '#121026', '#ffffff', '#ffff00', '#ff0000', '#0000ff', '#777777']) {
    const background = colorLuminance(color);
    const text = colorLuminance(contrastingText(color));
    const contrast = (Math.max(background, text) + .05) / (Math.min(background, text) + .05);
    assert.ok(contrast >= 4.5, `Contraste insuficiente para ${color}`);
  }
});
