# gl-tiled.js

This is the core library bundle. It is meant to work with WebGL, and therefore can work with any framework. However, it does not provide any special code to ease integration with those frameworks.

## API Reference

Exported classes:

- [`GLTilemap`](https://englercj.github.io/gl-tiled/classes/gltilemap.html)
- [`GLTileset`](https://englercj.github.io/gl-tiled/classes/gltileset.html)
- [`GLTilelayer`](https://englercj.github.io/gl-tiled/classes/gltilelayer.html)
- [`GLImagelayer`](https://englercj.github.io/gl-tiled/classes/glimagelayer.html)

## Unsupported features

- Objectgroups
    * Haven't decided what support for this would mean.
- Map tile render order
    * Currently only "Right Down" is supported, which is default. PRs welcome.
- Isometric, Isometric (Staggered), Hexagonal (Staggered)
    * Currently only orthographic is supported. PRs welcome.
