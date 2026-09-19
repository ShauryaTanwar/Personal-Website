import test from 'node:test';
import assert from 'node:assert/strict';
import { applyArtworkFallbacks, commonsImageUrl, enrichDemoArtwork } from '../src/profile/artwork.js';

test('Wikimedia file paths are safely encoded', () => {
    assert.equal(commonsImageUrl('File:Artist portrait (2025).jpg', 320), 'https://commons.wikimedia.org/wiki/Special:FilePath/Artist%20portrait%20(2025).jpg?width=320');
    assert.equal(commonsImageUrl(''), '');
});

test('tracks without album art inherit their primary artist image', () => {
    const profile = { artists: [{ id: 'a', image: 'https://example.com/artist.jpg' }], tracks: [{ id: 't1', artistId: 'a', image: null }, { id: 't2', artistId: 'a', image: 'https://example.com/album.jpg' }] };
    applyArtworkFallbacks(profile);
    assert.equal(profile.tracks[0].image, 'https://example.com/artist.jpg');
    assert.equal(profile.tracks[1].image, 'https://example.com/album.jpg');
});

test('demo artwork resolves P18 images and applies them to tracks', async () => {
    const profile = { artists: [{ id: 'a', name: 'Artist', wikipedia: 'Artist', image: null }], tracks: [{ id: 't', artistId: 'a', artistIds: ['a'], image: null }] };
    const load = async () => ({ entities: { Q1: { sitelinks: { enwiki: { title: 'Artist' } }, claims: { P18: [{ rank: 'normal', mainsnak: { datavalue: { value: 'Artist.jpg' } } }] } } } });
    await enrichDemoArtwork(profile, undefined, load);
    assert.match(profile.artists[0].image, /Special:FilePath\/Artist\.jpg/);
    assert.equal(profile.tracks[0].image, profile.artists[0].image);
    assert.equal(profile.artists[0].imageSource, 'Wikimedia Commons');
});
