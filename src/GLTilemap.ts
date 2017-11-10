import { vec2, mat3 } from 'gl-matrix';
import GLProgram from './utils/GLProgram';
import ITilemap from './tiled/Tilemap';
import ITileset, { ITile } from './tiled/Tileset';
import GLTileset from './GLTileset';
import GLTilelayer from './GLTilelayer';
import GLImagelayer from './GLImagelayer';

import backgroundVS from './shaders/background.vert';
import backgroundFS from './shaders/background.frag';
import tilelayerVS from './shaders/tilelayer.vert';
import tilelayerFS from './shaders/tilelayer.frag';
import imagelayerVS from './shaders/imagelayer.vert';
import imagelayerFS from './shaders/imagelayer.frag';

export enum ELayerType
{
    UNKNOWN = 0,
    Tilelayer,
    Imagelayer,
}

export type TGLLayer = (GLTilelayer | GLImagelayer);

interface IShaderCache
{
    [key: string]: GLProgram;

    tilelayer: GLProgram;
    imagelayer: GLProgram;
}

export default class GLTilemap
{
    private static _attribIndices: TMap<number> = {
        aPosition: 0,
        aTexture: 1,
    };

    public gl: WebGLRenderingContext;
    public shaders: IShaderCache;

    private _layers: TGLLayer[] = [];
    private _tilesets: GLTileset[] = [];

    private _viewportSize = vec2.create();
    private _scaledViewportSize = vec2.create();
    private _inverseLayerTileSize = vec2.create();
    private _inverseTilesetTextureSize = vec2.create();

    private _quadVerts = new Float32Array([
        //x  y  u  v
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,

        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0,
    ]);

    private _quadVertBuffer: WebGLBuffer;

    private _firstTilelayerUniformUpload = true;
    private _tileScale = 1;
    private _totalTilesetImages = 0;

    private _backgroundColor: Float32Array;
    private _tilesetIndices: Int32Array;
    private _tilesetTileSizeBuffer: Float32Array;
    private _tilesetTileOffsetBuffer: Float32Array;
    private _inverseTilesetTextureSizeBuffer: Float32Array;

    constructor(gl: WebGLRenderingContext, public desc: ITilemap, assets?: IAssets)
    {
        this._inverseLayerTileSize[0] = 1 / desc.tilewidth;
        this._inverseLayerTileSize[1] = 1 / desc.tileheight;

        for (let i = 0; i < desc.tilesets.length; ++i)
        {
            const tileset = new GLTileset(desc.tilesets[i], assets);
            this._totalTilesetImages += tileset.images.length;
            this._tilesets.push(tileset);
        }

        for (let i = 0; i < desc.layers.length; ++i)
        {
            const l = desc.layers[i];

            switch (l.type)
            {
                case 'tilelayer': this._layers.push(new GLTilelayer(l, this)); break;
                // case 'objectlayer': this._layers.push(new GLTilelayer(gl, l, this)); break;
                case 'imagelayer': this._layers.push(new GLImagelayer(l, this, assets)); break;
            }
        }

        // parse the background color
        this._backgroundColor = new Float32Array(4);

        const colorStr = desc.backgroundcolor;

        if (colorStr)
        {
            if (colorStr.length === 9)
            {
                this._backgroundColor[0] = parseInt(colorStr.substr(3, 2), 16) / 255;
                this._backgroundColor[1] = parseInt(colorStr.substr(5, 2), 16) / 255;
                this._backgroundColor[2] = parseInt(colorStr.substr(7, 2), 16) / 255;
                this._backgroundColor[3] = parseInt(colorStr.substr(1, 2), 16) / 255;
            }
            else if (colorStr.length === 7)
            {
                this._backgroundColor[0] = parseInt(colorStr.substr(1, 2), 16) / 255;
                this._backgroundColor[1] = parseInt(colorStr.substr(3, 2), 16) / 255;
                this._backgroundColor[2] = parseInt(colorStr.substr(5, 2), 16) / 255;
                this._backgroundColor[3] = 1.0;
            }
        }

        // setup the different buffers
        this._tilesetIndices = new Int32Array(this._totalTilesetImages);
        this._tilesetTileSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._tilesetTileOffsetBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._inverseTilesetTextureSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
        this._buildBufferData();

        this.glInitialize(gl);
    }

    get layers(): IReadonlyArray<TGLLayer>
    {
        return this._layers;
    }

    get tilesets(): IReadonlyArray<GLTileset>
    {
        return this._tilesets;
    }

    get viewportWidth()
    {
        return this._viewportSize[0];
    }

    get viewportHeight()
    {
        return this._viewportSize[1];
    }

    get scaledViewportWidth()
    {
        return this._scaledViewportSize[0];
    }

    get scaledViewportHeight()
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

    get tileScale()
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

    resizeViewport(width: number, height: number)
    {
        if (this._viewportSize[0] != width || this._viewportSize[1] != height)
        {
            this._viewportSize[0] = width;
            this._viewportSize[1] = height;
            this._updateViewportSize();
        }
    }

    glInitialize(gl: WebGLRenderingContext)
    {
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

    glTerminate()
    {
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
            const shader = this.shaders[k];

            if (shader)
            {
                gl.deleteProgram(shader.program);
                this.shaders[k] = null;
            }
        }

        this.gl = null;
    }

    /**
     * Updates each layer's animations by the given delta time.
     *
     * @param dt Delta time in milliseconds to perform an update for.
     */
    update(dt: number)
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
    draw(x: number = 0, y: number = 0)
    {
        var gl = this.gl;

        // TODO: Custom blending modes?
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Enable attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aPosition);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aTexture);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aTexture, 2, gl.FLOAT, false, 16, 8);

        // Draw background
        if (this._backgroundColor[3] > 0)
        {
            const bgShader = this.shaders.background;

            gl.useProgram(bgShader.program);
            gl.uniform4fv(bgShader.uniforms.uColor, this._backgroundColor);
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
        let activeShader: GLProgram = null;

        const invScale = 1.0 / this._tileScale;

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

            switch (layer.type)
            {
                case ELayerType.Tilelayer:
                    layer.uploadUniforms(activeShader);
                    gl.uniform2f(
                        activeShader.uniforms.uOffset,
                        -offsetx + (x * layer.scrollScaleX),
                        -offsety + (y * layer.scrollScaleY)
                    );
                    break;

                case ELayerType.Imagelayer:
                    layer.uploadUniforms(activeShader);
                    gl.uniform2f(
                        activeShader.uniforms.uOffset,
                        offsetx + (-x * layer.scrollScaleX),
                        -offsety + (y * layer.scrollScaleY)
                    );
                    break;
            }

            gl.bindTexture(gl.TEXTURE_2D, layer.texture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    private _bindShader(layer: TGLLayer): GLProgram
    {
        const gl = this.gl;

        switch (layer.type)
        {
            case ELayerType.Tilelayer:
            {
                const tileShader = this.shaders.tilelayer;
                gl.useProgram(tileShader.program);

                // these are static, and only need to be uploaded once.
                if (this._firstTilelayerUniformUpload)
                {
                    this._firstTilelayerUniformUpload = false;

                    gl.uniform1i(tileShader.uniforms.uLayer, 0);
                    gl.uniform2fv(tileShader.uniforms.uInverseLayerTileSize, this._inverseLayerTileSize);
                    gl.uniform1iv(tileShader.uniforms.uTilesets, this._tilesetIndices);
                    gl.uniform2fv(tileShader.uniforms.uTilesetTileSize, this._tilesetTileSizeBuffer);
                    gl.uniform2fv(tileShader.uniforms.uTilesetTileOffset, this._tilesetTileOffsetBuffer);
                    gl.uniform2fv(tileShader.uniforms.uInverseTilesetTextureSize, this._inverseTilesetTextureSizeBuffer);
                }

                return tileShader;
            }

            case ELayerType.Imagelayer:
            {
                const imageShader = this.shaders.imagelayer;
                gl.useProgram(imageShader.program);

                return imageShader;
            }
        }
    }

    private _updateViewportSize()
    {
        this._scaledViewportSize[0] = this._viewportSize[0] / this._tileScale;
        this._scaledViewportSize[1] = this._viewportSize[1] / this._tileScale;

        const gl = this.gl;

        const tileShader = this.shaders.tilelayer;
        gl.useProgram(tileShader.program);
        gl.uniform2fv(tileShader.uniforms.uViewportSize, this._scaledViewportSize);
        gl.uniform1f(tileShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);

        const imageShader = this.shaders.imagelayer;
        gl.useProgram(imageShader.program);
        gl.uniform2fv(imageShader.uniforms.uViewportSize, this._scaledViewportSize);
        gl.uniform1f(imageShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);
    }

    private _buildBufferData()
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

                const imgDesc: (ITile | ITileset) = tileset.desc.tiles && tileset.desc.tiles[s] ? tileset.desc.tiles[s] : tileset.desc;

                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / imgDesc.imagewidth;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / imgDesc.imageheight;

                imgIndex++;
            }
        }
    }

    private _createShaders()
    {
        const tilelayerFragShader = tilelayerFS
            .replace('#pragma define(NUM_TILESETS)', `#define NUM_TILESETS ${this._tilesets.length}`)
            .replace('#pragma define(NUM_TILESET_IMAGES)', `#define NUM_TILESET_IMAGES ${this._totalTilesetImages}`);

        this.shaders = {
            background: new GLProgram(this.gl, backgroundVS, backgroundFS, GLTilemap._attribIndices),
            tilelayer: new GLProgram(this.gl, tilelayerVS, tilelayerFragShader, GLTilemap._attribIndices),
            imagelayer: new GLProgram(this.gl, imagelayerVS, imagelayerFS, GLTilemap._attribIndices),
        };
    }
}
