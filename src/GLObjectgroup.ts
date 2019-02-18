
// @if DEBUG
import { ASSERT } from './debug';
import { ELayerType } from './ELayerType';
import { IObjectgroup } from './tiled/layers';
// @endif

export class GLObjectgroup
{
    type: ELayerType.Objectgroup = ELayerType.Objectgroup;

    gl: WebGLRenderingContext | null = null;

    constructor(public readonly desc: IObjectgroup)
    {
    }

    glInitialize(gl: WebGLRenderingContext)
    {
        this.glTerminate();

        this.gl = gl;
    }

    glTerminate()
    {
        if (!this.gl)
            return;

        this.gl = null;
    }
}
