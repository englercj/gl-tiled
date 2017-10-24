import { vec2 } from 'gl-matrix';
import { ITilelayer } from './tiled/Tilelayer';
import GLTilemap, { ELayerType } from './GLTilemap';
import GLTileset, { TilesetFlags, ITileProps } from './GLTileset';
import GLProgram from './utils/GLProgram';

// @if DEBUG
import { ASSERT } from './debug';
// @endif

interface IAnimationDataFrame
{
    /** How long this frame is displayed for. */
    duration: number;

    /** The time index at which this frame starts being displayed. */
    startTime: number;

    /** The time index at which this frame is over. */
    endTime: number;

    /** The id of the tile in the tileset of the frame to use. */
    tileid: number;

    /** The tile properties from the tileset about this frame's tile. */
    props: ITileProps;
}

interface IAnimationData
{
    /** The index into our data array of the tile to animate. */
    index: number;

    /** An array of frame data for the animation. */
    frames: IAnimationDataFrame[];

    /** The index of the currently active frame. */
    activeFrame: number;

    /**
     * The elapsed time of this animation. We store these separately per
     * animation so they can be offset from eachother if so desired.
     */
    elapsedTime: number;

    /** The maximum amount of time this animation lasts. Sum of all frame durations. */
    maxTime: number;
}

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
    type: ELayerType.Tilelayer = ELayerType.Tilelayer;

    public scrollScaleX = 1;
    public scrollScaleY = 1;

    public readonly texture: WebGLTexture;
    public readonly textureData: Uint8Array;

    private _animations: IAnimationData[] = [];

    private _inverseTileCount = vec2.create();

    private _alpha: number;

    private _firstUniformUpload = true;
    private _needUniformUpload = true;
    private _repeatTiles = true;

    constructor(public gl: WebGLRenderingContext, public desc: ITilelayer, map: GLTilemap)
    {
        this._inverseTileCount[0] = 1 / desc.width;
        this._inverseTileCount[1] = 1 / desc.height;

        this.texture = gl.createTexture();
        this.textureData = new Uint8Array(desc.width * desc.height * 4);

        this._alpha = typeof desc.opacity === 'number' ? desc.opacity : 1.0;

        // If this isn't true then we probably did something wrong or got bad data...
        // This has caught me putting in base64 data instead of array data more than once!
        if ((desc.width * desc.height) !== this.desc.data.length)
            throw new Error('Sizes are off!');

        this.buildMapTexture(map.tilesets);
        this.upload();
    }

    get alpha()
    {
        return this._alpha;
    }

    set alpha(v)
    {
        if (v !== this._alpha)
        {
            this._needUniformUpload = true;
            this._alpha = v;
        }
    }

    get repeatTiles()
    {
        return this._repeatTiles;
    }

    set repeatTiles(v)
    {
        if (v !== this._repeatTiles)
        {
            this._needUniformUpload = true;
            this._repeatTiles = v;
            this.setupTexture(); // delay until next draw?
        }
    }

    uploadUniforms(shader: GLProgram, force: boolean = false)
    {
        if (!force && !this._needUniformUpload)
            return;

        const gl = this.gl;

        gl.uniform1f(shader.uniforms.uAlpha, this._alpha);
        gl.uniform1i(shader.uniforms.uRepeatTiles, this._repeatTiles ? 1 : 0);

        // these are static and will only ever need to be uploaded once.
        if (force || this._firstUniformUpload)
        {
            this._firstUniformUpload = false;
            gl.uniform2fv(shader.uniforms.uInverseLayerTileCount, this._inverseTileCount);
        }

        this._needUniformUpload = false;
    }

    /**
     * Builds the texture used as the map for this layer. Each texture has the data
     * necessary for the shader to lookup the correct texel to display.
     *
     * @param tilesets The list of tilesets, who's images will be uploaded to the GPU elsewhere.
     */
    buildMapTexture(tilesets: IReadonlyArray<GLTileset>)
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

            if (gid)
            {
                for (let t = 0; t < tilesets.length; ++t)
                {
                    const tileset = tilesets[t];
                    const tileprops = tileset.getTileProperties(gid);

                    if (tileprops)
                    {
                        if (tileprops.tile && tileprops.tile.animation)
                        {
                            let maxTime = 0;

                            this._animations.push({
                                index,
                                activeFrame: -1,
                                elapsedTime: 0,
                                frames: tileprops.tile.animation.map((v) =>
                                {
                                    return {
                                        duration: v.duration,
                                        tileid: v.tileid,
                                        props: tileset.getTileProperties(v.tileid + tileset.desc.firstgid),
                                        startTime: maxTime,
                                        endTime: (maxTime += v.duration),
                                    };
                                }),
                                maxTime: 0,
                            });

                            this._animations[this._animations.length - 1].maxTime = maxTime;
                        }

                        this.textureData[index++] = tileprops.coords.x;
                        this.textureData[index++] = tileprops.coords.y;
                        this.textureData[index++] = tileprops.imgIndex + imgIndex;
                        this.textureData[index++] =
                            (tileprops.flippedX ? TilesetFlags.FlippedHorizontalFlag : 0)
                            | (tileprops.flippedY ? TilesetFlags.FlippedVerticalFlag : 0)
                            | (tileprops.flippedAD ? TilesetFlags.FlippedAntiDiagonalFlag : 0);

                        continue dataloop;
                    }

                    imgIndex += tilesets[t].images.length;
                }
            }

            // if we reach here, it was because either this tile is 0, meaning
            // there is no tile here. Or, we failed to find the tileset for it.

            // @if DEBUG
            // if we got here from a non-0 gid, then assert.
            ASSERT(gid === 0, `Unable to find tileset for gid: ${gid}`);
            // @endif

            // if we failed to find a tileset, or the gid was 0, just write an empty entry.
            this.textureData[index++] = 255;
            this.textureData[index++] = 255;
            this.textureData[index++] = 255;
            this.textureData[index++] = 255;
        }
    }

    /**
     * Updates the layer's animations by the given delta time.
     *
     * @param dt Delta time in milliseconds to perform an update for.
     */
    update(dt: number)
    {
        let needsUpload = false;

        for (let i = 0; i < this._animations.length; ++i)
        {
            const anim = this._animations[i];

            anim.elapsedTime = (anim.elapsedTime + dt) % anim.maxTime;

            for (let f = 0; f < anim.frames.length; ++f)
            {
                const frame = anim.frames[f];

                if (anim.elapsedTime >= frame.startTime && anim.elapsedTime < frame.endTime)
                {
                    if (anim.activeFrame !== f)
                    {
                        needsUpload = true;
                        anim.activeFrame = f;
                        this.textureData[anim.index] = frame.props.coords.x;
                        this.textureData[anim.index + 1] = frame.props.coords.y;
                    }

                    break;
                }
            }
        }

        // TODO: Incremental upload? Only upload changed ones?
        // Not sure if multiple subImage2D's will be faster...
        if (needsUpload)
            this.uploadData();
    }

    /**
     * Uploads the map texture to the GPU.
     *
     */
    upload()
    {
        this.setupTexture();
        this.uploadData(false);
    }

    uploadData(doBind: boolean = true)
    {
        const gl = this.gl;

        if (doBind)
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(gl.TEXTURE_2D,
            0,          // level
            gl.RGBA,    // internal format
            this.desc.width,
            this.desc.height,
            0,          // border
            gl.RGBA,    // format
            gl.UNSIGNED_BYTE, // type
            this.textureData
        );
    }

    setupTexture(doBind: boolean = true)
    {
        const gl = this.gl;

        if (doBind)
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

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
