import { vec2 } from 'gl-matrix';
import { ILayer } from './tiled/layers';
import { ITilemap } from './tiled/Tilemap';
import { assertNever } from './utils/assertNever';
import { GLProgram } from './utils/GLProgram';
import { hasOwnKey } from './utils/hasOwnKey';
import { parseColorStr } from './utils/parseColorStr';
import { ELayerType } from './ELayerType';
import { GLTileset } from './GLTileset';
import { GLObjectgroup } from './GLObjectgroup';
import { GLTilelayer } from './GLTilelayer';
import { GLImagelayer } from './GLImagelayer';
import { IAssetCache } from './IAssetCache';

import backgroundVS from './shaders/background.vert';
import backgroundFS from './shaders/background.frag';
import tilelayerVS from './shaders/tilelayer.vert';
import tilelayerFS from './shaders/tilelayer.frag';
import imagelayerVS from './shaders/imagelayer.vert';
import imagelayerFS from './shaders/imagelayer.frag';

// @if DEBUG
import { ASSERT } from './debug';
// @endif

export type TGLLayer = (GLTilelayer | GLImagelayer | GLObjectgroup);

export interface ITilemapOptions
{
    /** The WebGL context to use to render. */
    gl?: WebGLRenderingContext;

    /** A cache of preloaded assets. Keyed by URL as it appears in the tilemap data. */
    assetCache?: IAssetCache;

    /** Should we automatically create each imagelayer? Default: true */
    createAllImagelayers?: boolean;

    /** Should we automatically create each tilelayer? Default: true */
    createAllTilelayers?: boolean;

    /** Should we automatically create each tilelayer? Default: false */
    createAllObjectgroups?: boolean;
}

interface IShaderCache
{
    background: GLProgram;
    tilelayer: GLProgram;
    imagelayer: GLProgram;
}

export class GLTilemap
{
    private static _attribIndices = {
        aPosition: 0,
        aTexture: 1,
    };

    gl: WebGLRenderingContext | null = null;
    shaders: IShaderCache | null = null;

    readonly assetCache: IAssetCache | undefined = undefined;

    private _layers: TGLLayer[] = [];
    private _tilesets: GLTileset[] = [];

    private _viewportSize = vec2.create();
    private _scaledViewportSize = vec2.create();
    private _inverseLayerTileSize = vec2.create();

    private _quadVerts = new Float32Array([
        //x  y  u  v
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,

        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0,
    ]);

    private _quadVertBuffer: WebGLBuffer | null = null;

    private _firstTilelayerUniformUpload = true;
    private _tileScale = 1;
    private _totalTilesetImages = 0;

    private _backgroundColor: Float32Array;
    private _tilesetIndices: Int32Array;
    private _tilesetTileSizeBuffer: Float32Array;
    private _tilesetTileOffsetBuffer: Float32Array;
    private _inverseTilesetTextureSizeBuffer: Float32Array;

    constructor(public readonly desc: ITilemap, options: ITilemapOptions = {})
    {
        // @if DEBUG
        ASSERT(desc.version >= 1.2, `Unsupported JSON format version ${desc.version}, please update your JSON to v1.2`);
        // @endif

        if (options.assetCache)
            this.assetCache = options.assetCache;

        this._inverseLayerTileSize[0] = 1 / desc.tilewidth;
        this._inverseLayerTileSize[1] = 1 / desc.tileheight;

        for (let i = 0; i < desc.tilesets.length; ++i)
        {
            const tileset = new GLTileset(desc.tilesets[i], this.assetCache);
            this._totalTilesetImages += tileset.images.length;
            this._tilesets.push(tileset);
        }

        this._createInitialLayers(desc.layers, options);

        // parse the background color
        this._backgroundColor = new Float32Array(4);

        if (desc.backgroundcolor)
            parseColorStr(desc.backgroundcolor, this._backgroundColor);

        // setup the different buffers
        this._tilesetIndices = new Int32Array(this._totalTilesetImages);
        this._tilesetTileSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._tilesetTileOffsetBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._inverseTilesetTextureSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._buildBufferData();

        if (options.gl)
        {
            this.glInitialize(options.gl);
        }
    }

    get layers(): ReadonlyArray<TGLLayer>
    {
        return this._layers;
    }

    get tilesets(): ReadonlyArray<GLTileset>
    {
        return this._tilesets;
    }

    get viewportWidth(): number
    {
        return this._viewportSize[0];
    }

    get viewportHeight(): number
    {
        return this._viewportSize[1];
    }

    get scaledViewportWidth(): number
    {
        return this._scaledViewportSize[0];
    }

    get scaledViewportHeight(): number
    {
        return this._scaledViewportSize[1];
    }

    set repeatTiles(v: boolean)
    {
        for (let i = 0; i < this._layers.length; ++i)
        {
            const layer = this._layers[i];

            if (layer.type === ELayerType.Tilelayer)
            {
                layer.repeatTiles = false;
            }
        }
    }

    get tileScale(): number
    {
        return this._tileScale;
    }

    set tileScale(scale: number)
    {
        if (this._tileScale != scale)
        {
            this._tileScale = scale;
            this._updateViewportSize();
        }
    }

    resizeViewport(width: number, height: number): void
    {
        if (this._viewportSize[0] != width || this._viewportSize[1] != height)
        {
            this._viewportSize[0] = width;
            this._viewportSize[1] = height;
            this._updateViewportSize();
        }
    }

    glInitialize(gl: WebGLRenderingContext): void
    {
        this.glTerminate();

        this.gl = gl;
        this._firstTilelayerUniformUpload = true;

        // initialize layers
        for (let i = 0; i < this._layers.length; ++i)
        {
            this._layers[i].glInitialize(gl);
        }

        // initialize tilesets
        for (let i = 0; i < this._tilesets.length; ++i)
        {
            this._tilesets[i].glInitialize(gl);
        }

        // create buffers
        this._quadVertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._quadVerts, gl.STATIC_DRAW);

        // create shaders
        this._createShaders();

        // update viewport uniforms
        this._updateViewportSize();
    }

    glTerminate(): void
    {
        if (!this.gl)
            return;

        const gl = this.gl;

        // destroy layers
        for (let i = 0; i < this._layers.length; ++i)
        {
            this._layers[i].glTerminate();
        }

        // destroy tilesets
        for (let i = 0; i < this._tilesets.length; ++i)
        {
            this._tilesets[i].glTerminate();
        }

        // destroy buffers
        if (this._quadVertBuffer)
        {
            gl.deleteBuffer(this._quadVertBuffer);
            this._quadVertBuffer = null;
        }

        // destroy shaders
        for (const k in this.shaders)
        {
            if (!hasOwnKey(this.shaders, k))
                continue;

            const shader = this.shaders[k];
            gl.deleteProgram(shader.program);
        }

        this.shaders = null;
        this.gl = null;
    }

    /**
     * Updates each layer's animations by the given delta time.
     *
     * @param dt Delta time in milliseconds to perform an update for.
     */
    update(dt: number): void
    {
        for (let i = 0; i < this.layers.length; ++i)
        {
            const layer = this._layers[i];

            if (layer.type === ELayerType.Tilelayer)
                layer.update(dt);
        }
    }

    /**
     * Draws the tilemap.
     *
     * @param x The x offset at which to draw the map
     * @param y The y offset at which to draw the map
     */
    draw(x: number = 0, y: number = 0): void
    {
        // @if DEBUG
        ASSERT(!!(this.gl && this.shaders), 'Cannot call `draw` before `glInitialize`.');
        // @endif

        if (!this.gl || !this.shaders)
            return;

        var gl = this.gl;

        // TODO: Custom blending modes?
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Enable attributes, these are the same for all shaders.
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aPosition);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aTexture);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aTexture, 2, gl.FLOAT, false, 16, 8);

        // Draw background
        if (this._backgroundColor[3] > 0)
        {
            const bgShader = this.shaders.background;

            // @if DEBUG
            ASSERT(!!(bgShader.uniforms.uColor), 'Invalid uniforms for background shader.');
            // @endif

            gl.useProgram(bgShader.program);
            gl.uniform4fv(bgShader.uniforms.uColor!, this._backgroundColor);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // Bind tileset textures
        let imgIndex = 0;
        for (let i = 0; i < this._tilesets.length; ++i)
        {
            const tileset = this._tilesets[i];

            for (let t = 0; t < tileset.textures.length; ++t)
            {
                this.gl.activeTexture(gl.TEXTURE1 + imgIndex);
                this.gl.bindTexture(this.gl.TEXTURE_2D, tileset.textures[t]);
                imgIndex++;
            }
        }

        // Draw each layer of the map
        gl.activeTexture(gl.TEXTURE0);

        let lastShader = ELayerType.UNKNOWN;
        let activeShader: GLProgram | null = null;

        for (let i = 0; i < this._layers.length; ++i)
        {
            const layer = this._layers[i];
            const offsetx = layer.desc.offsetx || 0;
            const offsety = layer.desc.offsety || 0;

            if (!layer.desc.visible)
                continue;

            if (lastShader != layer.type)
            {
                activeShader = this._bindShader(layer);
                lastShader = layer.type;
            }

            if (!activeShader)
                continue;

            // @if DEBUG
            ASSERT(!!(activeShader.uniforms.uOffset), 'Invalid uniforms for layer shader.');
            // @endif

            switch (layer.type)
            {
                case ELayerType.Tilelayer:
                    layer.uploadUniforms(activeShader);
                    gl.uniform2f(
                        activeShader.uniforms.uOffset!,
                        -offsetx + (x * layer.scrollScaleX),
                        -offsety + (y * layer.scrollScaleY)
                    );
                    break;

                case ELayerType.Imagelayer:
                    layer.uploadUniforms(activeShader);
                    gl.uniform2f(
                        activeShader.uniforms.uOffset!,
                        offsetx + (-x * layer.scrollScaleX),
                        -offsety + (y * layer.scrollScaleY)
                    );
                    break;

                case ELayerType.Objectgroup:
                    break;

                default:
                    assertNever(layer);
            }

            if (layer.type !== ELayerType.Objectgroup)
            {
                gl.bindTexture(gl.TEXTURE_2D, layer.texture);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }

    createLayer(...name: string[]): boolean
    {
        if (name.length === 0)
            return false;

        const layer = this._findLayer(this.desc.layers, name, 0);

        if (!layer)
            return false;

        this._createLayer(layer);

        return true;
    }

    private _bindShader(layer: TGLLayer): GLProgram
    {
        // @if DEBUG
        ASSERT(!!(this.gl && this.shaders), 'Cannot call `_bindShader` before `glInitialize`.');
        // @endif

        const gl = this.gl!;

        switch (layer.type)
        {
            case ELayerType.Tilelayer:
            {
                const tileShader = this.shaders!.tilelayer;
                gl.useProgram(tileShader.program);

                // these are static, and only need to be uploaded once.
                if (this._firstTilelayerUniformUpload)
                {
                    this._firstTilelayerUniformUpload = false;

                    // @if DEBUG
                    ASSERT(!!(tileShader.uniforms.uLayer
                        && tileShader.uniforms.uInverseLayerTileSize
                        && tileShader.uniforms.uTilesets
                        && tileShader.uniforms.uTilesetTileSize
                        && tileShader.uniforms.uTilesetTileOffset
                        && tileShader.uniforms.uInverseTilesetTextureSize),
                        'Invalid uniforms for tile layer shader.');
                    // @endif

                    gl.uniform1i(tileShader.uniforms.uLayer!, 0);
                    gl.uniform2fv(tileShader.uniforms.uInverseLayerTileSize!, this._inverseLayerTileSize);
                    gl.uniform1iv(tileShader.uniforms.uTilesets!, this._tilesetIndices);
                    gl.uniform2fv(tileShader.uniforms.uTilesetTileSize!, this._tilesetTileSizeBuffer);
                    gl.uniform2fv(tileShader.uniforms.uTilesetTileOffset!, this._tilesetTileOffsetBuffer);
                    gl.uniform2fv(tileShader.uniforms.uInverseTilesetTextureSize!, this._inverseTilesetTextureSizeBuffer);
                }

                return tileShader;
            }

            case ELayerType.Imagelayer:
            case ELayerType.Objectgroup:
            {
                const imageShader = this.shaders!.imagelayer;
                gl.useProgram(imageShader.program);

                return imageShader;
            }

            default:
                return assertNever(layer);
        }
    }

    private _updateViewportSize(): void
    {
        // @if DEBUG
        ASSERT(!!(this.gl && this.shaders), 'Cannot call `_updateViewportSize` before `glInitialize`.');
        // @endif

        this._scaledViewportSize[0] = this._viewportSize[0] / this._tileScale;
        this._scaledViewportSize[1] = this._viewportSize[1] / this._tileScale;

        const gl = this.gl!;

        const tileShader = this.shaders!.tilelayer;

        // @if DEBUG
        ASSERT(!!(tileShader.uniforms.uViewportSize
            && tileShader.uniforms.uInverseTileScale),
            'Invalid uniforms for tile layer shader.');
        // @endif

        gl.useProgram(tileShader.program);
        gl.uniform2fv(tileShader.uniforms.uViewportSize!, this._scaledViewportSize);
        gl.uniform1f(tileShader.uniforms.uInverseTileScale!, 1.0 / this._tileScale);

        const imageShader = this.shaders!.imagelayer;

        // @if DEBUG
        ASSERT(!!(imageShader.uniforms.uViewportSize
            && imageShader.uniforms.uInverseTileScale),
            'Invalid uniforms for image shader.');
        // @endif

        gl.useProgram(imageShader.program);
        gl.uniform2fv(imageShader.uniforms.uViewportSize!, this._scaledViewportSize);
        gl.uniform1f(imageShader.uniforms.uInverseTileScale!, 1.0 / this._tileScale);
    }

    private _buildBufferData(): void
    {
        // Index buffer
        for (let i = 0; i < this._tilesetIndices.length; ++i)
            this._tilesetIndices[i] = i + 1;

        // tileset size buffers
        let imgIndex = 0;
        for (let i = 0; i < this._tilesets.length; ++i)
        {
            const tileset = this._tilesets[i];

            for (let s = 0; s < tileset.images.length; ++s)
            {
                this._tilesetTileSizeBuffer[(imgIndex * 2)] = tileset.desc.tilewidth;
                this._tilesetTileSizeBuffer[(imgIndex * 2) + 1] = tileset.desc.tileheight;

                this._tilesetTileOffsetBuffer[(imgIndex * 2)] = tileset.desc.spacing;
                this._tilesetTileOffsetBuffer[(imgIndex * 2) + 1] = tileset.desc.margin;

                const imgDesc = tileset.desc.tiles && tileset.desc.tiles[s];
                const imgWidth = imgDesc && imgDesc.imagewidth ? imgDesc.imagewidth : tileset.desc.imagewidth;
                const imgHeight = imgDesc && imgDesc.imageheight ? imgDesc.imageheight : tileset.desc.imageheight;

                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / imgWidth;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / imgHeight;

                imgIndex++;
            }
        }
    }

    private _findLayer(layers: ILayer[], names: string[], nameIndex: number): ILayer | null
    {
        for (let i = 0; i < layers.length; ++i)
        {
            const layer = layers[i];

            if (layer.name === names[nameIndex])
            {
                if (layer.type === 'group')
                {
                    // more names, so try something in this group
                    if (names.length < nameIndex + 1)
                    {
                        return this._findLayer(layer.layers, names, ++nameIndex);
                    }
                    // No more names, return the group.
                    else
                    {
                        return layer;
                    }
                }
                else
                {
                    return layer;
                }
            }
        }

        return null;
    }

    private _createLayer(layer: ILayer): void
    {
        switch (layer.type)
        {
            case 'tilelayer':
                this._layers.push(new GLTilelayer(layer, this.tilesets));
                break;

            case 'objectgroup':
                this._layers.push(new GLObjectgroup(layer));
                break;

            case 'imagelayer':
                this._layers.push(new GLImagelayer(layer, this.assetCache));
                break;

            case 'group':
                for (let i = 0; i < layer.layers.length; ++i)
                {
                    this._createLayer(layer.layers[i]);
                }
                break;

            default:
                return assertNever(layer);
        }
    }

    private _createInitialLayers(layers: ILayer[], options: ITilemapOptions): void
    {
        const createTilelayers = typeof options.createAllTilelayers === 'boolean' ? options.createAllTilelayers : true;
        const createImagelayers = typeof options.createAllImagelayers === 'boolean' ? options.createAllImagelayers : true;
        const createObjectgroups = typeof options.createAllObjectgroups === 'boolean' ? options.createAllObjectgroups : false;

        // We don't create anything, early out.
        if (!createTilelayers && !createImagelayers && !createObjectgroups)
            return;

        for (let i = 0; i < layers.length; ++i)
        {
            const layer = layers[i];

            if ((layer.type === 'tilelayer' && createTilelayers)
                || (layer.type === 'objectgroup' && createObjectgroups)
                || (layer.type === 'imagelayer' && createImagelayers))
            {
                this._createLayer(layer);
            }
            else if (layer.type === 'group')
            {
                this._createInitialLayers(layer.layers, options);
            }
        }
    }

    private _createShaders(): void
    {
        // @if DEBUG
        ASSERT(!!(this.gl), 'Cannot call `_createShaders` before `glInitialize`.');
        // @endif

        const tilelayerFragShader = tilelayerFS
            .replace('#pragma define(NUM_TILESETS)', `#define NUM_TILESETS ${this._tilesets.length}`)
            .replace('#pragma define(NUM_TILESET_IMAGES)', `#define NUM_TILESET_IMAGES ${this._totalTilesetImages}`);

        const gl = this.gl!;

        this.shaders = {
            background: new GLProgram(gl, backgroundVS, backgroundFS, GLTilemap._attribIndices),
            tilelayer: new GLProgram(gl, tilelayerVS, tilelayerFragShader, GLTilemap._attribIndices),
            imagelayer: new GLProgram(gl, imagelayerVS, imagelayerFS, GLTilemap._attribIndices),
        };
    }
}
