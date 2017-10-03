import { vec2 } from 'gl-matrix';
import GLProgram from './gl/GLProgram';
import { ITilelayer } from './tiled/Tilelayer';
import ITilemap from './tiled/Tilemap';
import GLTileset from './GLTileset';
import GLTilelayer from './GLTilelayer';

import tilelayerVS from './shaders/tilelayer.vert';
import tilelayerFS from './shaders/tilelayer.frag';

export default class GLTilemap
{
    public layers: GLTilelayer[] = [];
    public tilesets: GLTileset[] = [];

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
    private _tilelayerShader: GLProgram;

    private _firstUniformUpload = true;
    private _needUniformUpload = true;
    private _tileScale = 1;

    private _tilesetIndices: Int32Array;
    private _tilesetTileSizeBuffer: Float32Array;
    private _inverseTilesetTextureSizeBuffer: Float32Array;

    constructor(public gl: WebGLRenderingContext, public desc: ITilemap, assets?: IAssets)
    {
        this._inverseLayerTileSize[0] = 1 / desc.tilewidth;
        this._inverseLayerTileSize[1] = 1 / desc.tileheight;

        this._quadVertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._quadVerts, gl.STATIC_DRAW);

        let totalTilesetImages = 0;
        for (let i = 0; i < desc.tilesets.length; ++i)
        {
            const tileset = new GLTileset(gl, desc.tilesets[i], assets);
            totalTilesetImages += tileset.images.length;
            this.tilesets.push(tileset);
        }

        for (let i = 0; i < desc.layers.length; ++i)
        {
            const l = desc.layers[i];

            switch (l.type)
            {
                case 'tilelayer': this.layers.push(new GLTilelayer(gl, l, this)); break;
                // case 'objectlayer': this.layers.push(new GLTilelayer(gl, l, this)); break;
                // case 'imagelayer': this.layers.push(new GLTilelayer(gl, l, this)); break;
            }
        }

        this._tilesetIndices = new Int32Array(totalTilesetImages);
        this._tilesetTileSizeBuffer = new Float32Array(totalTilesetImages * 2);
        this._inverseTilesetTextureSizeBuffer = new Float32Array(totalTilesetImages * 2);
        this._buildBuffers();

        const fragShader = tilelayerFS
            .replace('#pragma NUM_TILESETS', `#define NUM_TILESETS ${this.tilesets.length}`)
            .replace('#pragma NUM_TILESET_IMAGES', `#define NUM_TILESET_IMAGES ${totalTilesetImages}`);

        this._tilelayerShader = new GLProgram(gl, tilelayerVS, fragShader);
    }

    set repeatTiles(v: boolean)
    {
        for (let i = 0; i < this.layers.length; ++i)
        {
            this.layers[i].repeatTiles = false;
        }
    }

    resizeViewport(width: number, height: number)
    {
        if (this._viewportSize[0] != width || this._viewportSize[1] != height)
        {
            this._needUniformUpload = true;

            this._viewportSize[0] = width;
            this._viewportSize[1] = height;

            this._scaledViewportSize[0] = width / this._tileScale;
            this._scaledViewportSize[1] = height / this._tileScale;
        }
    }

    get tileScale() { return this._tileScale; }

    set tileScale(scale: number)
    {
        if (this._tileScale != scale)
        {
            this._needUniformUpload = true;
            this._tileScale = scale;

            this._scaledViewportSize[0] = this._viewportSize[0] / scale;
            this._scaledViewportSize[1] = this._viewportSize[1] / scale;
        }
    }

    uploadUniforms(shader: GLProgram, force: boolean = false)
    {
        if (!force && !this._needUniformUpload)
            return;

        const gl = this.gl;

        gl.uniform2fv(shader.uniforms.uViewportSize, this._scaledViewportSize);

        // these are static and will only ever need to be uploaded once.
        if (force || this._firstUniformUpload)
        {
            this._firstUniformUpload = false;

            gl.uniform1i(shader.uniforms.uLayer, 0);
            gl.uniform2fv(shader.uniforms.uInverseLayerTileSize, this._inverseLayerTileSize);
            gl.uniform1iv(shader.uniforms.uTilesets, this._tilesetIndices);
            gl.uniform2fv(shader.uniforms.uTilesetTileSize, this._tilesetTileSizeBuffer);
            gl.uniform2fv(shader.uniforms.uInverseTilesetTextureSize, this._inverseTilesetTextureSizeBuffer);
        }

        this._needUniformUpload = false;
    }

    draw(x: number = 0, y: number = 0)
    {
        var gl = this.gl;

        // TODO: Custom blending modes?
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const shader = this._tilelayerShader;
        gl.useProgram(shader.program);

        // Enable attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.enableVertexAttribArray(shader.attributes.aPosition);
        gl.enableVertexAttribArray(shader.attributes.aTexture);
        gl.vertexAttribPointer(shader.attributes.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(shader.attributes.aTexture, 2, gl.FLOAT, false, 16, 8);

        // upload tilemap uniforms
        this.uploadUniforms(shader);

        // Bind tileset textures
        let imgIndex = 0;
        for (let i = 0; i < this.tilesets.length; ++i)
        {
            const tileset = this.tilesets[i];

            for (let t = 0; t < tileset.textures.length; ++t)
            {
                this.gl.activeTexture(gl.TEXTURE1 + imgIndex);
                this.gl.bindTexture(this.gl.TEXTURE_2D, tileset.textures[t]);
                imgIndex++;
            }
        }

        // Draw each layer of the map
        gl.activeTexture(gl.TEXTURE0);

        for (let i = 0; i < this.layers.length; ++i)
        {
            const layer = this.layers[i];

            gl.uniform2f(shader.uniforms.uViewportOffset, Math.floor(x * this._tileScale * layer.scrollScaleX), Math.floor(y * this._tileScale * layer.scrollScaleY));
            layer.uploadUniforms(shader);

            gl.bindTexture(gl.TEXTURE_2D, layer.mapTexture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    private _buildBuffers()
    {
        // Index buffer
        for (let i = 0; i < this._tilesetIndices.length; ++i)
            this._tilesetIndices[i] = i + 1;

        // tileset size buffers
        let imgIndex = 0;
        for (let i = 0; i < this.tilesets.length; ++i)
        {
            const tileset = this.tilesets[i];

            for (let s = 0; s < tileset.images.length; ++s)
            {
                this._tilesetTileSizeBuffer[(imgIndex * 2)] = tileset.desc.tilewidth;
                this._tilesetTileSizeBuffer[(imgIndex * 2) + 1] = tileset.desc.tileheight;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / tileset.desc.imagewidth;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / tileset.desc.imageheight;

                imgIndex++;
            }
        }
    }
}
