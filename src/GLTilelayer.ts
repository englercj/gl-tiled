import { vec2 } from 'gl-matrix';
import { ITilelayer } from './tiled/Tilelayer';
import GLTilemap from './GLTilemap';
import GLTileset, { TilesetFlags } from './GLTileset';

/**
 * Due to the storage format used tileset images are limited to
 * 256 x 256 tiles, and there can only be up to 256 tilesets. Similarly
 * a multi-image tileset can only have up-to 256 images.
 *
 * Since a tileset sheet with 256x256 tiles at 16x16 tile size is 4096x4096
 * pixels I think this restriciton is probably OK. Additonally if you actually
 * approach the 256 image/tileset limit it will likely be a GPU bandwidth issue
 * long before it is an issue with our storage format here.
 *
 */
export default class GLTilelayer
{
    public scrollScaleX = 1;
    public scrollScaleY = 1;

    public mapTextureData: Uint8Array;
    public mapTexture: WebGLTexture;

    public inverseTextureSize = vec2.create();

    public alpha: number;

    private _repeatTiles: boolean;

    constructor(public gl: WebGLRenderingContext, public desc: ITilelayer, map: GLTilemap)
    {
        this.inverseTextureSize[0] = 1 / desc.width;
        this.inverseTextureSize[1] = 1 / desc.height;

        this.mapTexture = gl.createTexture();
        this.mapTextureData = new Uint8Array(desc.width * desc.height * 4);

        this.alpha = typeof desc.opacity === 'number' ? desc.opacity : 1.0;

        this._repeatTiles = true;

        // should be true...
        if ((desc.width * desc.height) !== this.desc.data.length)
            throw new Error('Sizes are off!');

        this.buildMapTexture(map.tilesets);
        this.upload();
    }

    get repeatTiles()
    {
        return this._repeatTiles;
    }

    set repeatTiles(v)
    {
        if (v !== this._repeatTiles)
        {
            this._repeatTiles = v;
            this.setupTexture();
        }
    }

    /**
     * Builds the texture used as the map for this layer. Each texture has the data
     * necessary for the shader to lookup the correct texel to display.
     *
     * @param tilesets The list of tilesets, who's images will be uploaded to the GPU elsewhere.
     */
    buildMapTexture(tilesets: GLTileset[])
    {
        // TODO:
        // - Might be faster to build this texture on the GPU in a framebuffer?
        // - Should it then be read back into RAM so it can be modified on CPU?
        // - Should it just be calculated at runtime in the main shader (upload tileset metadata)?
        //  * Isn't this last one the same as what I do here? I'd still
        //    have to format the tileset data for upload...
        let index = 0;

        dataloop:
        for (let i = 0; i < this.desc.data.length; ++i)
        {
            const gid = this.desc.data[i];
            let imgIndex = 0;

            for (let t = 0; t < tilesets.length; ++t)
            {
                const tileprops = tilesets[t].getTileProperties(gid);

                if (tileprops)
                {
                    this.mapTextureData[index++] = tileprops.coords.x;
                    this.mapTextureData[index++] = tileprops.coords.y;
                    this.mapTextureData[index++] = tileprops.imgIndex + imgIndex;
                    this.mapTextureData[index++] =
                        (tileprops.flippedX ? TilesetFlags.FlippedHorizontalFlag : 0)
                        | (tileprops.flippedY ? TilesetFlags.FlippedVerticalFlag : 0)
                        | (tileprops.flippedAD ? TilesetFlags.FlippedAntiDiagonalFlag : 0);

                    continue dataloop;
                }

                imgIndex += tilesets[t].images.length;
            }

            // if we reach here, it was because either this tile is 0, meaning
            // there is no tile here. Or, we failed to find the tileset for it.

            // if we got here from a non-0 gid, then explode
            if (gid)
                throw new Error('Unable to find tileset for gid: ' + gid);

            // otherwise just write an empty entry
            this.mapTextureData[index++] = 255;
            this.mapTextureData[index++] = 255;
            this.mapTextureData[index++] = 255;
            this.mapTextureData[index++] = 255;
        }
    }

    /**
     * Uploads the map texture to the GPU.
     *
     */
    upload()
    {
        const gl = this.gl;

        this.setupTexture();

        gl.texImage2D(gl.TEXTURE_2D,
            0,          // level
            gl.RGBA,    // internal format
            this.desc.width,
            this.desc.height,
            0,          // border
            gl.RGBA,    // format
            gl.UNSIGNED_BYTE, // type
            this.mapTextureData
        );
    }

    setupTexture()
    {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);

        // MUST be filtered with NEAREST or tile lookup fails
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        if (this._repeatTiles)
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        else
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }
}
