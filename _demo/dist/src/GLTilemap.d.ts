import { ILayer } from './tiled/layers';
import { ITilemap } from './tiled/Tilemap';
import { GLProgram } from './utils/GLProgram';
import { GLTileset } from './GLTileset';
import { GLTilelayer } from './GLTilelayer';
import { GLImagelayer } from './GLImagelayer';
import { IAssetCache } from './IAssetCache';
export declare type TGLLayer = GLTilelayer | GLImagelayer;
export interface IBlendMode {
    /**
     * A 2 or 4 element array specifying which blend function to use.
     *
     * Default: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
     */
    func: number[];
    /** What blend equation to use. Default: gl.FUNC_ADD */
    equation: number;
}
export interface ITilemapOptions {
    /** The WebGL context to use to render. */
    gl?: WebGLRenderingContext;
    /** A cache of preloaded assets. Keyed by URL as it appears in the tilemap data. */
    assetCache?: IAssetCache;
    /** What blend function/equation should we draw with? */
    blendMode?: IBlendMode;
    /** Should we render the background color of the map? Default: true */
    renderBackgroundColor?: boolean;
    /** Should we automatically create each imagelayer? Default: true */
    createAllImagelayers?: boolean;
    /** Should we automatically create each tilelayer? Default: true */
    createAllTilelayers?: boolean;
}
interface IShaderCache {
    background: GLProgram;
    tilelayer: GLProgram;
    imagelayer: GLProgram;
}
export declare class GLTilemap {
    readonly desc: ITilemap;
    private static _attribIndices;
    gl: WebGLRenderingContext | null;
    shaders: IShaderCache | null;
    renderBackgroundColor: boolean;
    blendMode: IBlendMode;
    readonly assetCache: IAssetCache | undefined;
    private _layers;
    private _tilesets;
    private _viewportSize;
    private _scaledViewportSize;
    private _inverseLayerTileSize;
    private _quadVerts;
    private _quadVertBuffer;
    private _firstTilelayerUniformUpload;
    private _tileScale;
    private _totalTilesetImages;
    private _backgroundColor;
    private _tilesetIndices;
    private _tilesetTileSizeBuffer;
    private _tilesetTileOffsetBuffer;
    private _inverseTilesetTextureSizeBuffer;
    constructor(desc: ITilemap, options?: ITilemapOptions);
    get layers(): ReadonlyArray<TGLLayer>;
    get tilesets(): ReadonlyArray<GLTileset>;
    get viewportWidth(): number;
    get viewportHeight(): number;
    get scaledViewportWidth(): number;
    get scaledViewportHeight(): number;
    set repeatTiles(v: boolean);
    get tileScale(): number;
    set tileScale(scale: number);
    resizeViewport(width: number, height: number): void;
    glInitialize(gl: WebGLRenderingContext): void;
    glTerminate(): void;
    /**
     * Updates each layer's animations by the given delta time.
     *
     * @param dt Delta time in milliseconds to perform an update for.
     */
    update(dt: number): void;
    /**
     * Draws the tilemap.
     *
     * @param x The x offset at which to draw the map
     * @param y The y offset at which to draw the map
     */
    draw(x?: number, y?: number): void;
    findLayerDesc(...name: string[]): ILayer | null;
    createLayer(...name: string[]): boolean;
    destroyLayer(...name: string[]): boolean;
    createLayerFromDesc(layer: ILayer): void;
    destroyLayerFromDesc(layerDesc: ILayer): boolean;
    private _doFindLayerDesc;
    private _bindShader;
    private _updateViewportSize;
    private _buildBufferData;
    private _createInitialLayers;
    private _createShaders;
}
export {};
