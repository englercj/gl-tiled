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
    public tilesetIndices: Int32Array[];

    public viewportSize = vec2.create();
    public scaledViewportSize = vec2.create();
    public inverseLayerTileSize = vec2.create();
    public inverseTilesetTextureSize = vec2.create();

    public quadVerts = new Float32Array([
        //x  y  u  v
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,

        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0,
    ]);

    public tileScale = 1;

    public quadVertBuffer: WebGLBuffer;
    public tilelayerShader: GLProgram;

    private _tilesetIndices: Int32Array;
    private _tilesetTileSizeBuffer: Float32Array;
    private _inverseTilesetTextureSizeBuffer: Float32Array;

    constructor(public gl: WebGLRenderingContext, public desc: ITilemap, assets?: IAssets)
    {
        this.inverseLayerTileSize[0] = 1 / desc.tilewidth;
        this.inverseLayerTileSize[1] = 1 / desc.tileheight;

        this.quadVertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.quadVerts, gl.STATIC_DRAW);

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

        for (let i = 0; i < this._tilesetIndices.length; ++i)
            this._tilesetIndices[i] = i + 1;

        const fragShader = tilelayerFS
            .replace('#pragma NUM_TILESETS', `#define NUM_TILESETS ${this.tilesets.length}`)
            .replace('#pragma NUM_TILESET_IMAGES', `#define NUM_TILESET_IMAGES ${totalTilesetImages}`);

        this.tilelayerShader = new GLProgram(gl, tilelayerVS, fragShader);
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
        this.viewportSize[0] = width;
        this.viewportSize[1] = height;

        this.scaledViewportSize[0] = width / this.tileScale;
        this.scaledViewportSize[1] = height / this.tileScale;
    }

    setTileScale(scale: number)
    {
        this.tileScale = scale;

        this.scaledViewportSize[0] = this.viewportSize[0] / scale;
        this.scaledViewportSize[1] = this.viewportSize[1] / scale;
    }

    draw(x: number = 0, y: number = 0)
    {
        var gl = this.gl;

        // TODO: Custom blending modes?
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const shader = this.tilelayerShader;
        gl.useProgram(shader.program);

        // Enable attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);
        gl.enableVertexAttribArray(shader.attributes.aPosition);
        gl.enableVertexAttribArray(shader.attributes.aTexture);
        gl.vertexAttribPointer(shader.attributes.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(shader.attributes.aTexture, 2, gl.FLOAT, false, 16, 8);

        // Upload global uniforms
        gl.uniform2fv(shader.uniforms.uViewportSize, this.scaledViewportSize);
        gl.uniform2fv(shader.uniforms.uInverseLayerTileSize, this.inverseLayerTileSize);

        // Bind tileset images and data
        // TODO: Move this out of draw, only need to do it once (especially the buffers)
        // TODO: Wait on textures of tilesets to load!
        let imgIndex = 0;
        for (let i = 0; i < this.tilesets.length; ++i)
        {
            const tileset = this.tilesets[i];

            for (let s = 0; s < tileset.images.length; ++s)
            {
                const tx = tileset.textures[s];
                const img = tileset.images[s];

                gl.activeTexture(gl.TEXTURE1 + imgIndex);
                gl.bindTexture(gl.TEXTURE_2D, tx);

                this._tilesetTileSizeBuffer[(imgIndex * 2)] = tileset.desc.tilewidth;
                this._tilesetTileSizeBuffer[(imgIndex * 2) + 1] = tileset.desc.tileheight;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / img.width;
                this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / img.height;

                imgIndex++;
            }
        }
        gl.uniform1iv(shader.uniforms.uTilesets, this._tilesetIndices);

        gl.uniform2fv(shader.uniforms.uTilesetTileSize, this._tilesetTileSizeBuffer);
        gl.uniform2fv(shader.uniforms.uInverseTilesetTextureSize, this._inverseTilesetTextureSizeBuffer);

        // Draw each layer of the map
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(shader.uniforms.uLayer, 0);

        for (let i = 0; i < this.layers.length; ++i)
        {
            const layer = this.layers[i];

            if (layer)
            {
                gl.uniform2f(shader.uniforms.uViewportOffset, Math.floor(x * this.tileScale * layer.scrollScaleX), Math.floor(y * this.tileScale * layer.scrollScaleY));
                gl.uniform2fv(shader.uniforms.uInverseLayerTextureSize, layer.inverseTextureSize);
                gl.uniform1f(shader.uniforms.uAlpha, layer.alpha);
                gl.uniform1i(shader.uniforms.uRepeatTiles, layer.repeatTiles ? 1 : 0);
                gl.bindTexture(gl.TEXTURE_2D, layer.mapTexture);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }
}
