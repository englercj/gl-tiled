import { IDictionary } from '../IDictionary';
import { hasOwnKey } from './hasOwnKey';

/**
 * Helper class to manage GL shader programs.
 *
 */
export class GLProgram
{
    /** The underlying GL program. */
    program: WebGLProgram;

    /** The attribute locations of this program */
    attributes: IDictionary<number> = {};

    /** The uniform locations of this program */
    uniforms: IDictionary<WebGLUniformLocation> = {};

    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    constructor(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: IDictionary<number>)
    {
        this.program = GLProgram.compileProgram(
            gl,
            vertexSrc,
            fragmentSrc,
            attributeLocations
        );

        // build a list of attribute locations
        const aCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < aCount; ++i)
        {
            const attrib = gl.getActiveAttrib(this.program, i);

            if (attrib)
            {
                this.attributes[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
            }
        }

        // build a list of uniform locations
        const uCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uCount; ++i)
        {
            const uniform = gl.getActiveUniform(this.program, i);

            if (uniform)
            {
                const name = uniform.name.replace('[0]', '');
                const loc = gl.getUniformLocation(this.program, name);

                if (loc)
                {
                    this.uniforms[name] = loc;
                }
            }
        }
    }

    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    static compileProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: IDictionary<number>): WebGLProgram
    {
        const glVertShader = GLProgram.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
        const glFragShader = GLProgram.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

        const program = gl.createProgram();

        if (!program)
        {
            throw new Error('Failed to create WebGL program object.');
        }

        gl.attachShader(program, glVertShader);
        gl.attachShader(program, glFragShader);

        // optionally, set the attributes manually for the program rather than letting WebGL decide..
        if (attributeLocations)
        {
            for (const k in attributeLocations)
            {
                if (!hasOwnKey(attributeLocations, k))
                    continue;

                const location = attributeLocations[k];

                if (location)
                {
                    gl.bindAttribLocation(program, location, k);
                }
            }
        }

        gl.linkProgram(program);

        // if linking fails, then log and cleanup
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            const errLog = gl.getProgramInfoLog(program);

            gl.deleteProgram(program);
            gl.deleteShader(glVertShader);
            gl.deleteShader(glFragShader);

            throw new Error(`Could not link shader program. Log:\n${errLog}`);
        }

        // clean up some shaders
        gl.deleteShader(glVertShader);
        gl.deleteShader(glFragShader);

        return program;
    }

    /**
     * Compiles source into a program.
     *
     * @param gl The rendering context.
     * @param type The type, can be either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
     * @param source The fragment shader source as an array of strings.
     */
    static compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader
    {
        const shader = gl.createShader(type);

        if (!shader)
        {
            throw new Error('Failed to create WebGL shader object.');
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            const errLog = gl.getShaderInfoLog(shader);

            gl.deleteShader(shader);

            throw new Error(`Failed to compile shader. Log:\n${errLog}`);
        }

        return shader;
    }
}
