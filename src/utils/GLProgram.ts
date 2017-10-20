/**
 * Helper class to manage GL shader programs.
 *
 */
export default class GLProgram
{
    /** The underlying GL program. */
    public program: WebGLProgram;

    /** The attribute locations of this program */
    public attributes: TMap<number>;

    /** The uniform locations of this program */
    public uniforms: TMap<WebGLUniformLocation>;

    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    constructor(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: TMap<number>)
    {
        this.program = GLProgram.compileProgram(
            gl,
            vertexSrc,
            fragmentSrc,
            attributeLocations
        );

        // build a list of attribute locations
        this.attributes = {};
        const aCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < aCount; ++i)
        {
            const attrib = gl.getActiveAttrib(this.program, i);
            this.attributes[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
        }

        // build a list of uniform locations
        this.uniforms = {};
        const uCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uCount; ++i) {
            const uniform = gl.getActiveUniform(this.program, i);
            const name = uniform.name.replace('[0]', '');
            this.uniforms[name] = gl.getUniformLocation(this.program, name);
        }
    }

    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    static compileProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: TMap<number>): WebGLProgram
    {
        const glVertShader = GLProgram.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
        const glFragShader = GLProgram.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

        const program = gl.createProgram();

        gl.attachShader(program, glVertShader);
        gl.attachShader(program, glFragShader);

        // optionally, set the attributes manually for the program rather than letting WebGL decide..
        if (attributeLocations)
        {
            for (const i in attributeLocations)
            {
                gl.bindAttribLocation(program, attributeLocations[i], i);
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