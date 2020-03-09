import { ITilelayer } from './tiled/layers';
import { ELayerType } from './ELayerType';
import { GLTileset } from './GLTileset';
import { GLProgram } from './utils/GLProgram';
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
export declare class GLTilelayer {
    readonly desc: ITilelayer;
    type: ELayerType.Tilelayer;
    gl: WebGLRenderingContext | null;
    scrollScaleX: number;
    scrollScaleY: number;
    texture: WebGLTexture | null;
    textureData: Uint8Array;
    alpha: number;
    private _animations;
    private _inverseTileCount;
    private _repeatTiles;
    constructor(desc: ITilelayer, tilesets: ReadonlyArray<GLTileset>);
    get repeatTiles(): boolean;
    set repeatTiles(v: boolean);
    glInitialize(gl: WebGLRenderingContext): void;
    glTerminate(): void;
    /**
     * Updates the layer's animations by the given delta time.
     *
     * @param dt Delta time in milliseconds to perform an update for.
     */
    update(dt: number): void;
    uploadUniforms(shader: GLProgram): void;
    private _upload;
    private _uploadData;
    private _setupTexture;
    /**
     * Builds the texture used as the map for this layer. Each texture has the data
     * necessary for the shader to lookup the correct texel to display.
     *
     * @param tilesets The list of tilesets, who's images will be uploaded to the GPU elsewhere.
     */
    private _buildMapTexture;
    private _addAnimation;
}
