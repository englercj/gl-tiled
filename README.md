# gl-tiled

A WebGL renderer for the [Tiled Editor](http://mapeditor.org).

Tested with Tiled Map Editor v1.0.3.

## TODO:

- Objectlayer support
- User-defined blend modes between layers
- User-defined texture filter modes
 * Need a way to do linear filtering without tile tearing when zooming in
 * Possibility: Render at scale 1 to a framebuffer, scale the frambuffer linearly
