declare module 'gl-matrix/vec2'
{
    /**
     * 2 Dimensional Vector
     * @module vec2
     */
    type vec2 = Float32Array;
    type mat2d = Float32Array;
    type mat2 = Float32Array;
    type mat3 = Float32Array;
    type mat4 = Float32Array;

    /**
     * Creates a new, empty vec2
     *
     * @returns {vec2} a new 2D vector
     */
    export function create(): vec2;

    /**
     * Creates a new vec2 initialized with values from an existing vector
     *
     * @param {vec2} a vector to clone
     * @returns {vec2} a new 2D vector
     */
    export function clone(a: vec2): vec2;

    /**
     * Creates a new vec2 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} a new 2D vector
     */
    export function fromValues(x: number, y: number): vec2;

    /**
     * Copy the values from one vec2 to another
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the source vector
     * @returns {vec2} out
     */
    export function copy(out: vec2, a: vec2): vec2;

    /**
     * Set the components of a vec2 to the given values
     *
     * @param {vec2} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} out
     */
    export function set(out: vec2, x: number, y: number): vec2;

    /**
     * Adds two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function add(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Subtracts vector b from vector a
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function subtract(out: vec2, a: vec2, b: vec2): vec2;
    export function sub(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Multiplies two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function multiply(out: vec2, a: vec2, b: vec2): vec2;
    export function mul(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Divides two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function divide(out: vec2, a: vec2, b: vec2): vec2;
    export function div(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Math.ceil the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to ceil
     * @returns {vec2} out
     */
    export function ceil(out: vec2, a: vec2): vec2;

    /**
     * Math.floor the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to floor
     * @returns {vec2} out
     */
    export function floor(out: vec2, a: vec2): vec2;

    /**
     * Returns the minimum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function min(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Returns the maximum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    export function max(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Math.round the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to round
     * @returns {vec2} out
     */
    export function round (out: vec2, a: vec2): vec2;

    /**
     * Scales a vec2 by a scalar number
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec2} out
     */
    export function scale(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Adds two vec2's after scaling the second operand by a scalar value
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec2} out
     */
    export function scaleAndAdd(out: vec2, a: vec2, b: vec2, scale: number): vec2;

    /**
     * Calculates the euclidian distance between two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} distance between a and b
     */
    export function distance(a: vec2, b: vec2): number;
    export function dist(a: vec2, b: vec2): number;

    /**
     * Calculates the squared euclidian distance between two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} squared distance between a and b
     */
    export function squaredDistance(a: vec2, b: vec2): number;
    export function sqrDist(a: vec2, b: vec2): number;

    /**
     * Calculates the length of a vec2
     *
     * @param {vec2} a vector to calculate length of
     * @returns {Number} length of a
     */
    export function length(a: vec2): number;
    export function len(a: vec2): number;

    /**
     * Calculates the squared length of a vec2
     *
     * @param {vec2} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    export function squaredLength(a: vec2): number;
    export function sqrLen(a: vec2): number;

    /**
     * Negates the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to negate
     * @returns {vec2} out
     */
    export function negate(out: vec2, a: vec2): vec2;

    /**
     * Returns the inverse of the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to invert
     * @returns {vec2} out
     */
    export function inverse(out: vec2, a: vec2): vec2;

    /**
     * Normalize a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to normalize
     * @returns {vec2} out
     */
    export function normalize(out: vec2, a: vec2): vec2;

    /**
     * Calculates the dot product of two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} dot product of a and b
     */
    export function dot(a: vec2, b: vec2): number;

    /**
     * Computes the cross product of two vec2's
     * Note that the cross product must by definition produce a 3D vector
     *
     * @param {vec3} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec3} out
     */
    export function cross(out: vec2, a: vec2, b: vec2): vec2;

    /**
     * Performs a linear interpolation between two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec2} out
     */
    export function lerp(out: vec2, a: vec2, b: vec2, t: number): vec2;

    /**
     * Generates a random vector with the given scale
     *
     * @param {vec2} out the receiving vector
     * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec2} out
     */
    export function random(out: vec2, scale: number): vec2;

    /**
     * Transforms the vec2 with a mat2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat2} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat2(out: vec2, a: vec2, m: mat2): vec2;

    /**
     * Transforms the vec2 with a mat2d
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat2d} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat2d(out: vec2, a: vec2, m: mat2d): vec2;

    /**
     * Transforms the vec2 with a mat3
     * 3rd vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat3} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat3(out: vec2, a: vec2, m: mat3): vec2;

    /**
     * Transforms the vec2 with a mat4
     * 3rd vector component is implicitly '0'
     * 4th vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec2} out
     */
    export function transformMat4(out: vec2, a: vec2, m: mat4): vec2;

    /**
     * Rotate a 2D vector
     * @param {vec2} out The receiving vec2
     * @param {vec2} a The vec2 point to rotate
     * @param {vec2} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec2} out
     */
    export function rotate(out: vec2, a: vec2, b: vec2, c: number): vec2;

    /**
     * Get the angle between two 2D vectors
     * @param {vec2} a The first operand
     * @param {vec2} b The second operand
     * @returns {Number} The angle in radians
     */
    export function angle(a: vec2, b: vec2): number;

    /**
     * Set the components of a vec2 to zero
     *
     * @param {vec2} out the receiving vector
     * @returns {vec2} out
     */
    export function zero(out: vec2): vec2;

    /**
     * Returns a string representation of a vector
     *
     * @param {vec2} a vector to represent as a string
     * @returns {String} string representation of the vector
     */
    export function str(a: vec2): string;

    /**
     * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
     *
     * @param {vec2} a The first vector.
     * @param {vec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function exactEquals(a: vec2, b: vec2): boolean;

    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {vec2} a The first vector.
     * @param {vec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    export function equals(a: vec2, b: vec2): boolean;

    /**
     * Perform some operation over an array of vec2s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */
    export function forEach(a: vec2[], stride: number, offset: number, count: number, fn: Function, arg: any): vec2[];
}
