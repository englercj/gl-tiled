# gl-tiled.resource-loader.js

The Resource Loader bundle a [resource-loader](https://github.com/englercj/resource-loader)
middleware that makes it easy to load Tiled JSON maps.

This bundle is unique in that it actually does not depend on the gl-tiled core, and therefore
this bundle doesn't actually contain the core library. That means you can combine this bundle
with any other bundle without conflicts.

For example, you can include the core library (for use with WebGL) and this bundle (for use
with resource-loader):

```html
<script src="node_modules/resource-loader/dist/resource-loader.js"></script>

<script src="dist/gl-tiled.js"></script>
<script src="dist/gl-tiled.resource-loader.js"></script>
```

## API Reference

Exported functions:

- [`tiledMiddlewareFactory()`](https://englercj.github.io/gl-tiled/modules/_bundles_resource_loader_index_.html#tiledmiddlewarefactory)
