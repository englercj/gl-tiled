import { Loader, Resource, ResourceType, ImageLoadStrategy } from 'resource-loader';
import { IAddOptions } from 'resource-loader/dist/Loader';

/**
 * Creates the tiled loader middleware function and returns it.
 *
 * @example
 * const loader = new Loader();
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
 */
export function tiledMiddlewareFactory()
{
    return function tiledMiddleware(this: Loader, resource: Resource, next: Function)
    {
        if (!resource.data
            || resource.type !== ResourceType.Json
            || !resource.data.layers
            || !resource.data.tilesets)
        {
            next();
            return;
        }

        let urlDir = resource.url.replace(this.baseUrl, '');
        urlDir = urlDir.substr(0, urlDir.lastIndexOf('/')) + '/';

        const addOptions: IAddOptions = {
            url: '',
            crossOrigin: resource.strategy.config.crossOrigin,
            strategy: ImageLoadStrategy,
            metadata: resource.metadata ? resource.metadata.imageMetadata : undefined,
            parentResource: resource,
        };

        for (let i = 0; i < resource.data.tilesets.length; ++i)
        {
            const tileset = resource.data.tilesets[i];

            if (tileset.image)
            {
                if (!this.resources[tileset.image])
                {
                    const options = Object.assign({}, addOptions);
                    options.name = tileset.image;
                    options.url = urlDir + tileset.image;
                    this.add(options);
                }
            }

            if (resource.data.tiles)
            {
                for (const key in resource.data.tiles)
                {
                    const tile = resource.data.tiles[key];

                    if (tile.image && !this.resources[tile.image])
                    {
                        const options = Object.assign({}, addOptions);
                        options.name = tile.image;
                        options.url = urlDir + tile.image;
                        this.add(options);
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
                    const options = Object.assign({}, addOptions);
                    options.name = layer.image;
                    options.url = urlDir + layer.image;
                    this.add(options);
                }
            }
        }

        next();
    }
}
