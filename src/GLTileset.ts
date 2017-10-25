import ITileset, { ITerrain, ITile } from './tiled/Tileset';
import { loadImage } from './utils/loadImage';

export interface ITileProps
{
    coords: IPoint;
    imgIndex: number;
    flippedX: boolean;
    flippedY: boolean;
    flippedAD: boolean;
    props: any;
    tile: ITile;
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
    public gl: WebGLRenderingContext;

    /** The images in this tileset. */
    public images: CanvasImageSource[] = [];

    /** The gl textures in this tileset */
    public textures: WebGLTexture[] = [];

    constructor(gl: WebGLRenderingContext, public desc: ITileset, assets?: IAssets)
    {
        this.glInitialize(gl);

        // load the images
        if (this.desc.image)
        {
            this._addImage(this.desc.image, assets);
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
                    this._addImage(tile.image, assets);
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
            tile: this.desc.tiles && this.desc.tiles[index],
        };
    }

    bind(startSlot: number)
    {
        for (let i = 0; i < this.textures.length; ++i)
        {
            this.gl.activeTexture(startSlot + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
        }
    }

    glInitialize(gl: WebGLRenderingContext)
    {
        this.gl = gl;

        for (let i = 0; i < this.textures.length; ++i)
        {
            const tex = this.textures[i];

            // If there is already a texture then that means the image finished
            // loading at some point, so we need to recreate the texture. If there
            // isn't a texture here, then the loading callback will hit at some point
            // and create the texture for us.
            if (tex)
            {
                this._createTexture(i);
            }
        }
    }

    glTerminate()
    {
        const gl = this.gl;

        for (let i = 0; i < this.textures.length; ++i)
        {
            const tex = this.textures[i];

            if (tex)
            {
                gl.deleteTexture(tex);
                this.textures[i] = null;
            }
        }

        this.gl = null;
    }

    private _addImage(src: string, assets?: IAssets)
    {
        const imgIndex = this.images.length;

        this.textures.push(null);
        this.images.push(null);
        loadImage(src, assets, (errEvent, img) =>
        {
            // in case glTerminate was called before loading finished
            if (!this.gl)
                return;

            this.images[imgIndex] = img;
            this._createTexture(imgIndex);
        });
    }

    private _createTexture(imgIndex: number)
    {
        const gl = this.gl;
        const img = this.images[imgIndex];
        const tex = this.textures[imgIndex] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // TODO: Allow user to set filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}
