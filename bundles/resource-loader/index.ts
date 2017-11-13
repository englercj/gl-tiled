/// <reference path="./resource-loader.d.ts" />

/**
 * Creates the tiled loader middleware function and returns it.
 *
 * @example
 * ```js
 *
 * var loader = new Loader();
 *
 * // add this middleware so that any map files we load will also have all their sub resources
 * // loaded too.
 * loader.use(glTiled['resource-loader'].tiledMiddlewareFactory());
 * loader.add('lightworld', 'maps/lttp/lightworld/lightworld.json');
 * loader.load(function ()
 * {
 *      // create the tilemap using the loaded map data (`resources.lightworld.data`) and passing
 *      // all resources as the third parameter which is the resource cache the Tilemap object
 *      // will search for map resources in before trying to load them itself.
 *      var tilemap = new glTiled.Tilemap(gl, loader.resources.lightworld.data, loader.resources);
 * })
 * ```
 */
export function tiledMiddlewareFactory()
{
    return function tiledMiddleware(this: Loader, resource: Loader.Resource, next: Function)
    {
        if (!resource.data
            || resource.type !== Loader.Resource.TYPE.JSON
            || !resource.data.layers
            || !resource.data.tilesets
        )
        {
            next();
            return;
        }

        const loadOptions: Loader.IResourceOptions = {
            crossOrigin: resource.crossOrigin,
            loadType: Loader.Resource.LOAD_TYPE.IMAGE,
            metadata: resource.metadata.imageMetadata,
            parentResource: resource,
        };

        let urlDir = resource.url.replace(this.baseUrl, '');

        urlDir = urlDir.substr(0, urlDir.lastIndexOf('/')) + '/';

        for (let i = 0; i < resource.data.tilesets.length; ++i)
        {
            const tileset = resource.data.tilesets[i];

            if (tileset.image)
            {
                if (!this.resources[tileset.image])
                {
                    this.add(tileset.image, urlDir + tileset.image, loadOptions);
                }
            }
            else if (resource.data.tiles)
            {
                for (const key in resource.data.tiles)
                {
                    const tile = resource.data.tiles[key];

                    if (tile.image && !this.resources[tile.image])
                    {
                        this.add(tile.image, urlDir + tile.image, loadOptions);
                    }
                }
            }
        }

        for (let i = 0; i < resource.data.layers.length; ++i)
        {
            const layer = resource.data.layers[i];

            if (layer.image)
            {
                if (!this.resources[layer.image])
                {
                    this.add(layer.image, urlDir + layer.image, loadOptions);
                }
            }
        }

        next();
    }
}
