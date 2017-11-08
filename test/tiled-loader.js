(function (exports) {
    exports.tiledMiddlewareFactory = function ()
    {
        return function tiledMiddleware(resource, next)
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

            const loadOptions = {
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
})(this || window);