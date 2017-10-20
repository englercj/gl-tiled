import { vec2, mat3 } from 'gl-matrix';
import { IImagelayer } from './tiled/Tilelayer';
import { loadImage } from './utils/loadImage';
import GLTilemap, { ELayerType } from './GLTilemap';
import GLProgram from './utils/GLProgram';

export default class GLImagelayer
{
    type: ELayerType.Imagelayer = ELayerType.Imagelayer;

    public scrollScaleX = 1;
    public scrollScaleY = 1;

    public readonly texture: WebGLTexture;
    public readonly image: CanvasImageSource;

    constructor(public gl: WebGLRenderingContext, public desc: IImagelayer, map: GLTilemap, assets?: IAssets)
    {
        this.texture = gl.createTexture();
        this.image = loadImage(desc.image, assets, (errEvent) =>
        {
            this._setupTexture();
        });
    }

    uploadUniforms(shader: GLProgram)
    {
        this.gl.uniform2f(shader.uniforms.uSize, this.image.width, this.image.height);
    }

    private _setupTexture()
    {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

        // TODO: Allow user to set filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}
