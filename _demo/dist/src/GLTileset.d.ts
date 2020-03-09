import { ITileset, ITile } from './tiled/Tileset';
import { IAssetCache } from './IAssetCache';
import { IPoint } from './IPoint';
export interface ITileProps {
    coords: IPoint;
    imgIndex: number;
    flippedX: boolean;
    flippedY: boolean;
    flippedAD: boolean;
    tile?: ITile;
}
/**
 * Tileset GID flags, these flags are set on a tile's ID to give it a special property
 *
 * @property FLAGS
 * @static
 */
export declare enum TilesetFlags {
    FlippedAntiDiagonal = 536870912,
    FlippedVertical = 1073741824,
    FlippedHorizontal = 2147483648,
    All = -536870912,
    FlippedAntiDiagonalFlag = 2,
    FlippedVerticalFlag = 4,
    FlippedHorizontalFlag = -8
}
export declare class GLTileset {
    readonly desc: ITileset;
    gl: WebGLRenderingContext | null;
    /** The images in this tileset. */
    images: (TexImageSource | null)[];
    /** The gl textures in this tileset */
    textures: (WebGLTexture | null)[];
    private _lidToTileMap;
    constructor(desc: ITileset, assetCache?: IAssetCache);
    /** The last gid in this tileset */
    get lastgid(): number;
    /**
     * Returns true if the given gid is contained in this tileset
     *
     * @param gid The global ID of the tile in a map.
     */
    containsGid(gid: number): boolean;
    /**
     * Returns true if the given index is contained in this tileset
     *
     * @param index The local index of a tile in this tileset.
     */
    containsLocalId(index: number): boolean;
    /**
     * Returns the tile ID for a given gid. Assumes it is within range
     *
     * @param gid The global ID of the tile in a map.
     */
    getTileLocalId(gid: number): number;
    /**
     * Gathers the properties of a tile
     *
     * @param gid The global ID of the tile in a map.
     */
    getTileProperties(gid: number): ITileProps | null;
    bind(startSlot: number): void;
    glInitialize(gl: WebGLRenderingContext): void;
    glTerminate(): void;
    private _addImage;
    private _createTexture;
}
