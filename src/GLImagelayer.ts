import { vec2, mat3 } from 'gl-matrix';
import { IImagelayer } from './tiled/Tilelayer';
import { loadImage } from './utils/loadImage';
import GLTilemap, { ELayerType } from './GLTilemap';
import GLProgram from './utils/GLProgram';

export default class GLImagelayer
{
    type: ELayerType.Imagelayer = ELayerType.Imagelayer;

    public gl: WebGLRenderingContext;

    public scrollScaleX = 1;
    public scrollScaleY = 1;

    public texture: WebGLTexture = null;
    public image: CanvasImageSource;

    constructor(public desc: IImagelayer, map: GLTilemap, assets?: IAssets)
    {
        loadImage(desc.image, assets, (errEvent, img) =>
        {
            this.image = img;
            this.upload();
        });
    }

    glInitialize(gl: WebGLRenderingContext)
    {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.upload();
    }

    glTerminate()
    {
        if (this.texture)
        {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }

        this.gl = null;
    }

    upload()
    {
        if (!this.gl || !this.image)
            return;

        this.setupTexture();
        this.uploadData(false);
    }

    uploadUniforms(shader: GLProgram)
    {
        if (!this.gl || !this.image)
            return;

        this.gl.uniform2f(shader.uniforms.uSize, this.image.width, this.image.height);
    }

    uploadData(doBind: boolean = true)
    {
        const gl = this.gl;

        if (doBind)
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    }

    setupTexture(doBind: boolean = true)
    {
        const gl = this.gl;

        if (doBind)
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // TODO: Allow user to set filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}
