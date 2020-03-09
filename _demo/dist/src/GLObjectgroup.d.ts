import { ELayerType } from './ELayerType';
import { IObjectgroup } from './tiled/layers';
import { GLTileset } from './GLTileset';
export declare class GLObjectgroup {
    readonly desc: IObjectgroup;
    type: ELayerType.Objectgroup;
    gl: WebGLRenderingContext | null;
    constructor(desc: IObjectgroup, tilesets: ReadonlyArray<GLTileset>);
    glInitialize(gl: WebGLRenderingContext): void;
    glTerminate(): void;
}
