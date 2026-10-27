import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayName, normalizeName, orderedTracks, type Track } from './library.ts';

test('preserva a convenção sus dos arquivos Python e o relativo menor', () => {
  assert.equal(normalizeName('Csus.AAC'), 'C#');
  assert.equal(displayName('C', 'minor'), 'Am');
  assert.equal(displayName('Am', 'major'), 'C');
  assert.equal(displayName('G#', 'minor'), 'Fm');
  assert.equal(displayName('Textura', 'minor'), 'Textura');
});

test('ordena cromaticamente e evita dois botões para o mesmo áudio tonal', () => {
  const tracks: Track[] = ['G', 'C#', 'C', 'Am'].map(name => ({ id: name, name, folder: 'Pads', url: name }));
  assert.deepEqual(orderedTracks(tracks).map(track => displayName(track.name, 'major')), ['C', 'C#', 'G']);
});
