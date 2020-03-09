import { IImagelayer } from './tiled/layers';
import { ELayerType } from './ELayerType';
import { GLProgram } from './utils/GLProgram';
import { IAssetCache } from './IAssetCache';
export declare class GLImagelayer {
    readonly desc: IImagelayer;
    type: ELayerType.Imagelayer;
    scrollScaleX: number;
    scrollScaleY: number;
    gl: WebGLRenderingContext | null;
    texture: WebGLTexture | null;
    image: TexImageSource | null;
    alpha: number;
    private _transparentColor;
    constructor(desc: IImagelayer, assetCache?: IAssetCache);
    glInitialize(gl: WebGLRenderingContext): void;
    glTerminate(): void;
    upload(): void;
    uploadUniforms(shader: GLProgram): void;
    uploadData(doBind?: boolean): void;
    setupTexture(doBind?: boolean): void;
}
