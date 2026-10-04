# Asset credits (AI-generated)

## Rendering

Three.js release 0.170.0 and its matching OrbitControls are bundled in `vendor/` under the MIT license included as `vendor/THREE-LICENSE.txt`.

- https://unpkg.com/three@0.170.0/build/three.module.js
- https://unpkg.com/three@0.170.0/examples/jsm/controls/OrbitControls.js
- https://unpkg.com/three@0.170.0/LICENSE

## Earth imagery

The 4096 × 2048 Earth and cloud textures were downloaded from Bjørn Sandvik's WebGL Earth example, which demonstrates a globe using NASA imagery. They are stored locally so the application does not depend on texture hotlinks at runtime. These are illustrative global textures, not current satellite weather imagery or authoritative political boundaries.

- `assets/earth.jpg`: https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg
- `assets/clouds.png`: https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png
- Example: https://github.com/turban/webgl-earth
- Explanation: https://blog.thematicmapping.org/2013/09/creating-webgl-earth-with-threejs.html

Clouds in the PNG use the alpha channel for density. The renderer samples both RGB and alpha; the reveal mask is separate and stays fixed to geography.

## Other visuals

The compass favicon is an original simple SVG created for this project. The interface is CSS and text; no generated raster mockup is used as application UI. Google Fonts supplies DM Sans and Manrope at runtime with system fallbacks.

## Data attribution

Photon uses OpenStreetMap data, © OpenStreetMap contributors, available under ODbL: https://www.openstreetmap.org/copyright. The interface links to the attribution in its Sources & about dialog. Open-Meteo supplies weather and a GeoNames-based city-search fallback: https://open-meteo.com/.

## Observatory revision

`assets/star-atlas.svg` is original procedural SVG artwork generated for the interface. Stars and constellation strokes are decorative. Cloud rendering combines the existing satellite texture with procedural billow shading; it is a discovery effect, not live weather imagery. Typography now uses Cormorant Garamond, IBM Plex Mono, and Libre Franklin from Google Fonts with local system fallbacks.

Interface references: [Google Earth](https://earth.google.com/intl/en_en/) for globe-first navigation and map controls; [NASA Eyes](https://science.nasa.gov/eyes/) for an astronomy-oriented exploration setting. No Google or NASA interface screenshots or logos are embedded in the application.
