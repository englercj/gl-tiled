# gl-tiled.js

This is the core library bundle. It is meant to work with WebGL, and therefore can work with any
framework. However, it does not provide any special code to ease integration with those frameworks.

## API Reference

Exported classes:

- [GLTilemap](https://englercj.github.io/gl-tiled/classes/_gltilemap_.gltilemap.html)
- [GLTileset](https://englercj.github.io/gl-tiled/classes/_gltileset_.gltileset.html)
- [GLTilelayer](https://englercj.github.io/gl-tiled/classes/_gltilelayer_.gltilelayer.html)
- [GLImagelayer](https://englercj.github.io/gl-tiled/classes/_glimagelayer_.glimagelayer.html)

## Implementation Details

COMING SOON!

### Tilelayer Rendering

### Imagelayer Rendering

## Unsupported features

- Objectlayers
- Map tile render order
    * Currently only "Right Down" is supported, which is default.
- Isometric, Isometric (Staggered), Hexagonal (Staggered)
    * Currently only orthographic is supported.

## Todo

- User-defined blend modes between layers
- User-defined texture filter modes
    * Need a way to do linear filtering without tile tearing when zooming in
    * Possibility: Render at scale 1 to a framebuffer, scale the frambuffer linearly
