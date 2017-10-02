import ITileset, { ITerrain, ITile } from './tiled/Tileset';

interface ITileProps
{
    coords: IPoint;
    imgIndex: number;
    flippedX: boolean;
    flippedY: boolean;
    flippedAD: boolean;
    props: any;
}

/**
 * Tileset GID flags, these flags are set on a tile's ID to give it a special property
 *
 * @property FLAGS
 * @static
 */
export enum TilesetFlags {
    FlippedAntiDiagonal = 0x20000000,
    FlippedVertical     = 0x40000000,
    FlippedHorizontal   = 0x80000000,
    All = FlippedHorizontal | FlippedVertical | FlippedAntiDiagonal,

    FlippedAntiDiagonalFlag = FlippedAntiDiagonal >> 28,
    FlippedVerticalFlag     = FlippedVertical >> 28,
    FlippedHorizontalFlag   = FlippedHorizontal >> 28,
};

export default class GLTileset
{
    /** The images in this tileset. */
    public images: HTMLImageElement[] = [];

    /** The gl textures in this tileset */
    public textures: WebGLTexture[] = [];

    constructor(public gl: WebGLRenderingContext, public desc: ITileset, assets?: IAssets)
    {
        // load the images
        if (this.desc.image)
        {
            this.addImage(this.desc.image, assets);
        }
        else if (this.desc.tiles)
        {
            // need to sort because order matters here, and can't guarantee that the object's keys will be ordered.
            // We need a custom comparator because .sort() is lexagraphic, not numeric.
            const ids = Object.keys(this.desc.tiles)
                                .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

            for (let i = 0; i < ids.length; ++i)
            {
                const tile = this.desc.tiles[ids[i]];

                if (tile.image)
                {
                    this.addImage(tile.image, assets);
                }
            }
        }
    }

    /** The last gid in this tileset */
    get lastgid()
    {
        return this.desc.firstgid + this.desc.tilecount;
    }

    /**
     * Returns true if the given gid is contained in this tileset
     *
     * @param gid The global ID of the tile in a map.
     */
    containsGid(gid: number)
    {
        return this.containsIndex(this.getTileIndex(gid));
    }

    /**
     * Returns true if the given index is contained in this tileset
     *
     * @param index The local index of a tile in this tileset.
     */
    containsIndex(index: number)
    {
        return index >= 0 && index < this.desc.tilecount;
    }

    /**
     * Returns the tile ID for a given gid. Assumes it is within range
     *
     * @param gid The global ID of the tile in a map.
     */
    getTileIndex(gid: number)
    {
        return (gid & ~TilesetFlags.All) - this.desc.firstgid;
    }

    /**
     * Gathers the properties of a tile
     *
     * @param gid The global ID of the tile in a map.
     */
    getTileProperties(gid: number): ITileProps
    {
        if (!gid)
            return null;

        const index = this.getTileIndex(gid);

        if (!this.containsIndex(index))
            return null;

        return {
            coords: {
                x: index % this.desc.columns,
                y: Math.floor(index / this.desc.columns),
            },
            imgIndex: this.images.length > 1 ? index : 0,
            flippedX: (gid & TilesetFlags.FlippedHorizontal) != 0,
            flippedY: (gid & TilesetFlags.FlippedVertical) != 0,
            flippedAD: (gid & TilesetFlags.FlippedAntiDiagonal) != 0,
            props: this.desc.tileproperties && this.desc.tileproperties[index],
        };
    }

    private addImage(src: string, assets?: IAssets)
    {
        const tex = this.gl.createTexture();
        const asset = assets && assets[src];
        let img: HTMLImageElement = null;

        if (asset)
        {
            img = asset instanceof HTMLImageElement ? asset : asset.data;
        }

        if (img)
        {
            this.setupTexture(img, tex);
        }
        else
        {
            img = new Image();
            img.src = src;
            img.addEventListener('load', () => this.setupTexture(img, tex));
        }

        this.images.push(img);
        this.textures.push(tex);
    }

    private setupTexture(img: HTMLImageElement, tex: WebGLTexture)
    {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // TODO: Allow user to set filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}
