# gl-tiled.js

This is the core library bundle. It is meant to work with WebGL, and therefore can work with any framework. However, it does not provide any special code to ease integration with those frameworks.

## API Reference

Exported classes:

- [`GLTilemap`](https://englercj.github.io/gl-tiled/classes/_src_gltilemap_.gltilemap.html)
- [`GLTileset`](https://englercj.github.io/gl-tiled/classes/_src_gltileset_.gltileset.html)
- [`GLTilelayer`](https://englercj.github.io/gl-tiled/classes/_src_gltilelayer_.gltilelayer.html)
- [`GLImagelayer`](https://englercj.github.io/gl-tiled/classes/_src_glimagelayer_.glimagelayer.html)

## Implementation Details

COMING SOON!

## Unsupported features

- Objectgroups
    * Haven't decided what support for this would mean.
- Map tile render order
    * Currently only "Right Down" is supported, which is default. PRs welcome.
- Isometric, Isometric (Staggered), Hexagonal (Staggered)
    * Currently only orthographic is supported. PRs welcome.
