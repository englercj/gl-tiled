import { IDictionary } from '../IDictionary';
/**
 * Helper class to manage GL shader programs.
 *
 */
export declare class GLProgram {
    /** The underlying GL program. */
    program: WebGLProgram;
    /** The attribute locations of this program */
    attributes: IDictionary<number>;
    /** The uniform locations of this program */
    uniforms: IDictionary<WebGLUniformLocation>;
    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    constructor(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: IDictionary<number>);
    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    static compileProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: IDictionary<number>): WebGLProgram;
    /**
     * Compiles source into a program.
     *
     * @param gl The rendering context.
     * @param type The type, can be either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
     * @param source The fragment shader source as an array of strings.
     */
    static compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader;
}
