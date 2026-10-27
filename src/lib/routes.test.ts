import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albumSlug, padPath, resolvePadRoute } from './routes.ts';
import type { Track } from './library.ts';

const tracks: Track[] = ['C', 'C#', 'D'].map(name => ({ id: name, name, folder: 'Angel', url: name }));
const folders = ['Angel', 'Álbum local'];

test('resolve álbum e tom, incluindo sustenidos e relativos menores', () => {
  const route = resolvePadRoute('/pad/angel/c', folders, tracks);
  assert.equal(route?.folder, 'Angel');
  assert.equal(route?.track?.name, 'C');
  assert.equal(route?.mode, 'major');
  assert.equal(resolvePadRoute('/pad/angel/c-sharp', folders, tracks)?.track?.name, 'C#');
  assert.equal(resolvePadRoute('/pad/angel/c%23', folders, tracks)?.track?.name, 'C#');
  assert.equal(resolvePadRoute('/pad/angel/am', folders, tracks)?.mode, 'minor');
  assert.equal(resolvePadRoute('/pad/angel', folders, tracks)?.track, null);
});

test('rejeita álbuns, tons e caminhos inexistentes', () => {
  for (const path of ['/pad/missing/c', '/pad/angel/f', '/pad', '/pad/angel/c/extra', '/other', '/pad/%invalid']) {
    assert.equal(resolvePadRoute(path, folders, tracks), null);
  }
});

test('gera rotas consistentes para nomes com espaços e slugs repetidos', () => {
  assert.equal(padPath('Angel', folders, tracks[1]), '/pad/angel/c-sharp');
  assert.equal(padPath('Angel', folders, tracks[0], 'minor'), '/pad/angel/am');
  assert.equal(padPath('Álbum local', folders), '/pad/album-local');
  const duplicates = ['Álbum', 'Album'];
  assert.notEqual(albumSlug(duplicates[0], duplicates), albumSlug(duplicates[1], duplicates));
});
