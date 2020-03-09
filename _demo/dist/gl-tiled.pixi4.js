/*!
* gl-tiled - v1.0.0
* Compiled Sun, 14 Oct 2018 18:56:01 UTC
*
* gl-tiled is licensed under the MIT License.
* http://www.opensource.org/licenses/mit-license
*/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.glTiled = global.glTiled || {}, global.glTiled.pixi4 = {})));
}(this, (function (exports) { 'use strict';

  /**
   * Common utilities
   * @module glMatrix
   */

  // Configuration Constants
  var EPSILON = 0.000001;
  var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;

  var degree = Math.PI / 180;

  /**
   * 3x3 Matrix
   * @module mat3
   */

  /**
   * Creates a new identity mat3
   *
   * @returns {mat3} a new 3x3 matrix
   */
  function create$2() {
    var out = new ARRAY_TYPE(9);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }

  /**
   * 3 Dimensional Vector
   * @module vec3
   */

  /**
   * Creates a new, empty vec3
   *
   * @returns {vec3} a new 3D vector
   */
  function create$4() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }

  /**
   * Calculates the length of a vec3
   *
   * @param {vec3} a vector to calculate length of
   * @returns {Number} length of a
   */
  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Creates a new vec3 initialized with the given values
   *
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} a new 3D vector
   */
  function fromValues$4(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }

  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a vector to normalize
   * @returns {vec3} out
   */
  function normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len = x * x + y * y + z * z;
    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
    }
    return out;
  }

  /**
   * Calculates the dot product of two vec3's
   *
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {Number} dot product of a and b
   */
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {vec3} out
   */
  function cross(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    var bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }

  /**
   * Alias for {@link vec3.length}
   * @function
   */
  var len = length;

  /**
   * Perform some operation over an array of vec3s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */
  var forEach = function () {
    var vec = create$4();

    return function (a, stride, offset, count, fn, arg) {
      var i = void 0,
          l = void 0;
      if (!stride) {
        stride = 3;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
      }

      return a;
    };
  }();

  /**
   * 4 Dimensional Vector
   * @module vec4
   */

  /**
   * Creates a new, empty vec4
   *
   * @returns {vec4} a new 4D vector
   */
  function create$5() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }
    return out;
  }

  /**
   * Normalize a vec4
   *
   * @param {vec4} out the receiving vector
   * @param {vec4} a vector to normalize
   * @returns {vec4} out
   */
  function normalize$1(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
    }
    return out;
  }

  /**
   * Perform some operation over an array of vec4s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */
  var forEach$1 = function () {
    var vec = create$5();

    return function (a, stride, offset, count, fn, arg) {
      var i = void 0,
          l = void 0;
      if (!stride) {
        stride = 4;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
      }

      return a;
    };
  }();

  /**
   * Quaternion
   * @module quat
   */

  /**
   * Creates a new identity quat
   *
   * @returns {quat} a new quaternion
   */
  function create$6() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    out[3] = 1;
    return out;
  }

  /**
   * Sets a quat from the given angle and rotation axis,
   * then returns it.
   *
   * @param {quat} out the receiving quaternion
   * @param {vec3} axis the axis around which to rotate
   * @param {Number} rad the angle in radians
   * @returns {quat} out
   **/
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }

  /**
   * Performs a spherical linear interpolation between two quat
   *
   * @param {quat} out the receiving quaternion
   * @param {quat} a the first operand
   * @param {quat} b the second operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */
  function slerp(out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    var bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    var omega = void 0,
        cosom = void 0,
        sinom = void 0,
        scale0 = void 0,
        scale1 = void 0;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if (cosom < 0.0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    // calculate coefficients
    if (1.0 - cosom > EPSILON) {
      // standard case (slerp)
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1.0 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      // "from" and "to" quaternions are very close
      //  ... so we can do a linear interpolation
      scale0 = 1.0 - t;
      scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;

    return out;
  }

  /**
   * Creates a quaternion from the given 3x3 rotation matrix.
   *
   * NOTE: The resultant quaternion is not normalized, so you should be sure
   * to renormalize the quaternion yourself where necessary.
   *
   * @param {quat} out the receiving quaternion
   * @param {mat3} m rotation matrix
   * @returns {quat} out
   * @function
   */
  function fromMat3(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot = void 0;

    if (fTrace > 0.0) {
      // |w| > 1/2, may as well choose w > 1/2
      fRoot = Math.sqrt(fTrace + 1.0); // 2w
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot; // 1/(4w)
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      // |w| <= 1/2
      var i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      var j = (i + 1) % 3;
      var k = (i + 2) % 3;

      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }

    return out;
  }

  /**
   * Normalize a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {quat} a quaternion to normalize
   * @returns {quat} out
   * @function
   */
  var normalize$2 = normalize$1;

  /**
   * Sets a quaternion to represent the shortest rotation from one
   * vector to another.
   *
   * Both vectors are assumed to be unit length.
   *
   * @param {quat} out the receiving quaternion.
   * @param {vec3} a the initial vector
   * @param {vec3} b the destination vector
   * @returns {quat} out
   */
  var rotationTo = function () {
    var tmpvec3 = create$4();
    var xUnitVec3 = fromValues$4(1, 0, 0);
    var yUnitVec3 = fromValues$4(0, 1, 0);

    return function (out, a, b) {
      var dot$$1 = dot(a, b);
      if (dot$$1 < -0.999999) {
        cross(tmpvec3, xUnitVec3, a);
        if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
        normalize(tmpvec3, tmpvec3);
        setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot$$1 > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        cross(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot$$1;
        return normalize$2(out, out);
      }
    };
  }();

  /**
   * Performs a spherical linear interpolation with two control points
   *
   * @param {quat} out the receiving quaternion
   * @param {quat} a the first operand
   * @param {quat} b the second operand
   * @param {quat} c the third operand
   * @param {quat} d the fourth operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */
  var sqlerp = function () {
    var temp1 = create$6();
    var temp2 = create$6();

    return function (out, a, b, c, d, t) {
      slerp(temp1, a, d, t);
      slerp(temp2, b, c, t);
      slerp(out, temp1, temp2, 2 * t * (1 - t));

      return out;
    };
  }();

  /**
   * Sets the specified quaternion with values corresponding to the given
   * axes. Each axis is a vec3 and is expected to be unit length and
   * perpendicular to all other specified axes.
   *
   * @param {vec3} view  the vector representing the viewing direction
   * @param {vec3} right the vector representing the local "right" direction
   * @param {vec3} up    the vector representing the local "up" direction
   * @returns {quat} out
   */
  var setAxes = function () {
    var matr = create$2();

    return function (out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];

      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];

      matr[2] = -view[0];
      matr[5] = -view[1];
      matr[8] = -view[2];

      return normalize$2(out, fromMat3(out, matr));
    };
  }();

  /**
   * 2 Dimensional Vector
   * @module vec2
   */

  /**
   * Creates a new, empty vec2
   *
   * @returns {vec2} a new 2D vector
   */
  function create$8() {
    var out = new ARRAY_TYPE(2);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }
    return out;
  }

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
  var forEach$2 = function () {
    var vec = create$8();

    return function (a, stride, offset, count, fn, arg) {
      var i = void 0,
          l = void 0;
      if (!stride) {
        stride = 2;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];vec[1] = a[i + 1];
        fn(vec, vec, arg);
        a[i] = vec[0];a[i + 1] = vec[1];
      }

      return a;
    };
  }();

  function parseColorStr(colorStr, outColor) {
      if (colorStr) {
          if (colorStr.length === 9) {
              outColor[0] = parseInt(colorStr.substr(3, 2), 16) / 255;
              outColor[1] = parseInt(colorStr.substr(5, 2), 16) / 255;
              outColor[2] = parseInt(colorStr.substr(7, 2), 16) / 255;
              outColor[3] = parseInt(colorStr.substr(1, 2), 16) / 255;
          }
          else if (colorStr.length === 7) {
              outColor[0] = parseInt(colorStr.substr(1, 2), 16) / 255;
              outColor[1] = parseInt(colorStr.substr(3, 2), 16) / 255;
              outColor[2] = parseInt(colorStr.substr(5, 2), 16) / 255;
              outColor[3] = 1.0;
          }
      }
  }

  var GLProgram = (function () {
      function GLProgram(gl, vertexSrc, fragmentSrc, attributeLocations) {
          this.program = GLProgram.compileProgram(gl, vertexSrc, fragmentSrc, attributeLocations);
          this.attributes = {};
          var aCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
          for (var i = 0; i < aCount; ++i) {
              var attrib = gl.getActiveAttrib(this.program, i);
              this.attributes[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
          }
          this.uniforms = {};
          var uCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
          for (var i = 0; i < uCount; ++i) {
              var uniform = gl.getActiveUniform(this.program, i);
              var name_1 = uniform.name.replace('[0]', '');
              this.uniforms[name_1] = gl.getUniformLocation(this.program, name_1);
          }
      }
      GLProgram.compileProgram = function (gl, vertexSrc, fragmentSrc, attributeLocations) {
          var glVertShader = GLProgram.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
          var glFragShader = GLProgram.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
          var program = gl.createProgram();
          gl.attachShader(program, glVertShader);
          gl.attachShader(program, glFragShader);
          if (attributeLocations) {
              for (var i in attributeLocations) {
                  gl.bindAttribLocation(program, attributeLocations[i], i);
              }
          }
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              var errLog = gl.getProgramInfoLog(program);
              gl.deleteProgram(program);
              gl.deleteShader(glVertShader);
              gl.deleteShader(glFragShader);
              throw new Error("Could not link shader program. Log:\n" + errLog);
          }
          gl.deleteShader(glVertShader);
          gl.deleteShader(glFragShader);
          return program;
      };
      GLProgram.compileShader = function (gl, type, source) {
          var shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              var errLog = gl.getShaderInfoLog(shader);
              gl.deleteShader(shader);
              throw new Error("Failed to compile shader. Log:\n" + errLog);
          }
          return shader;
      };
      return GLProgram;
  }());

  var ELayerType;
  (function (ELayerType) {
      ELayerType[ELayerType["UNKNOWN"] = 0] = "UNKNOWN";
      ELayerType[ELayerType["Tilelayer"] = 1] = "Tilelayer";
      ELayerType[ELayerType["Imagelayer"] = 2] = "Imagelayer";
  })(ELayerType || (ELayerType = {}));

  function loadImage(url, cache, cb) {
      var asset = cache && cache[url];
      var img = null;
      if (asset) {
          img = asset.data || asset;
      }
      if (img) {
          cb(null, img);
      }
      else {
          img = new Image();
          img.src = url;
          img.onload = function () {
              img.onload = null;
              img.onerror = null;
              if (cb)
                  cb(null, img);
          };
          img.onerror = function (e) {
              img.onload = null;
              img.onerror = null;
              if (cb)
                  cb(e, img);
          };
      }
      return img;
  }

  var TilesetFlags;
  (function (TilesetFlags) {
      TilesetFlags[TilesetFlags["FlippedAntiDiagonal"] = 536870912] = "FlippedAntiDiagonal";
      TilesetFlags[TilesetFlags["FlippedVertical"] = 1073741824] = "FlippedVertical";
      TilesetFlags[TilesetFlags["FlippedHorizontal"] = 2147483648] = "FlippedHorizontal";
      TilesetFlags[TilesetFlags["All"] = -536870912] = "All";
      TilesetFlags[TilesetFlags["FlippedAntiDiagonalFlag"] = 2] = "FlippedAntiDiagonalFlag";
      TilesetFlags[TilesetFlags["FlippedVerticalFlag"] = 4] = "FlippedVerticalFlag";
      TilesetFlags[TilesetFlags["FlippedHorizontalFlag"] = -8] = "FlippedHorizontalFlag";
  })(TilesetFlags || (TilesetFlags = {}));
  var GLTileset = (function () {
      function GLTileset(desc, assets) {
          this.desc = desc;
          this.images = [];
          this.textures = [];
          if (this.desc.image) {
              this._addImage(this.desc.image, assets);
          }
          else if (this.desc.tiles) {
              var ids = Object.keys(this.desc.tiles)
                  .sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
              for (var i = 0; i < ids.length; ++i) {
                  var tile = this.desc.tiles[ids[i]];
                  if (tile.image) {
                      this._addImage(tile.image, assets);
                  }
              }
          }
      }
      Object.defineProperty(GLTileset.prototype, "lastgid", {
          get: function () {
              return this.desc.firstgid + this.desc.tilecount;
          },
          enumerable: true,
          configurable: true
      });
      GLTileset.prototype.containsGid = function (gid) {
          return this.containsIndex(this.getTileIndex(gid));
      };
      GLTileset.prototype.containsIndex = function (index) {
          return index >= 0 && index < this.desc.tilecount;
      };
      GLTileset.prototype.getTileIndex = function (gid) {
          return (gid & ~TilesetFlags.All) - this.desc.firstgid;
      };
      GLTileset.prototype.getTileProperties = function (gid) {
          if (!gid)
              return null;
          var index = this.getTileIndex(gid);
          if (!this.containsIndex(index))
              return null;
          return {
              coords: {
                  x: index % this.desc.columns,
                  y: Math.floor(index / this.desc.columns),
              },
              imgIndex: this.images.length > 1 ? index : 0,
              flippedX: (gid & TilesetFlags.FlippedHorizontal) != 0,
              flippedY: (gid & TilesetFlags.FlippedVertical) != 0,
              flippedAD: (gid & TilesetFlags.FlippedAntiDiagonal) != 0,
              props: this.desc.tileproperties && this.desc.tileproperties[index],
              tile: this.desc.tiles && this.desc.tiles[index],
          };
      };
      GLTileset.prototype.bind = function (startSlot) {
          for (var i = 0; i < this.textures.length; ++i) {
              this.gl.activeTexture(startSlot + i);
              this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
          }
      };
      GLTileset.prototype.glInitialize = function (gl) {
          this.gl = gl;
          for (var i = 0; i < this.images.length; ++i) {
              if (this.images[i]) {
                  this._createTexture(i);
              }
          }
      };
      GLTileset.prototype.glTerminate = function () {
          var gl = this.gl;
          for (var i = 0; i < this.textures.length; ++i) {
              var tex = this.textures[i];
              if (tex) {
                  gl.deleteTexture(tex);
                  this.textures[i] = null;
              }
          }
          this.gl = null;
      };
      GLTileset.prototype._addImage = function (src, assets) {
          var _this = this;
          var imgIndex = this.images.length;
          this.textures.push(null);
          this.images.push(null);
          loadImage(src, assets, function (errEvent, img) {
              _this.images[imgIndex] = img;
              _this._createTexture(imgIndex);
          });
      };
      GLTileset.prototype._createTexture = function (imgIndex) {
          if (!this.gl)
              return;
          var gl = this.gl;
          var img = this.images[imgIndex];
          var tex = this.textures[imgIndex] = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      return GLTileset;
  }());

  var GLTilelayer = (function () {
      function GLTilelayer(desc, tilesets) {
          this.desc = desc;
          this.type = ELayerType.Tilelayer;
          this.scrollScaleX = 1;
          this.scrollScaleY = 1;
          this.texture = null;
          this._animations = [];
          this._inverseTileCount = create$8();
          this._repeatTiles = true;
          this._inverseTileCount[0] = 1 / desc.width;
          this._inverseTileCount[1] = 1 / desc.height;
          this.textureData = new Uint8Array(desc.width * desc.height * 4);
          this.alpha = typeof desc.opacity === 'number' ? desc.opacity : 1.0;
          if ((desc.width * desc.height) !== this.desc.data.length)
              throw new Error('Sizes are off!');
          this.buildMapTexture(tilesets);
      }
      Object.defineProperty(GLTilelayer.prototype, "repeatTiles", {
          get: function () {
              return this._repeatTiles;
          },
          set: function (v) {
              if (v !== this._repeatTiles) {
                  this._repeatTiles = v;
                  this.setupTexture();
              }
          },
          enumerable: true,
          configurable: true
      });
      GLTilelayer.prototype.glInitialize = function (gl) {
          this.gl = gl;
          this.texture = gl.createTexture();
          this.upload();
      };
      GLTilelayer.prototype.glTerminate = function () {
          if (this.texture) {
              this.gl.deleteTexture(this.texture);
              this.texture = null;
          }
          this.gl = null;
      };
      GLTilelayer.prototype.buildMapTexture = function (tilesets) {
          var index = 0;
          dataloop: for (var i = 0; i < this.desc.data.length; ++i) {
              var gid = this.desc.data[i];
              var imgIndex = 0;
              if (gid) {
                  var _loop_1 = function (t) {
                      var tileset = tilesets[t];
                      var tileprops = tileset.getTileProperties(gid);
                      if (tileprops) {
                          if (tileprops.tile && tileprops.tile.animation) {
                              var maxTime_1 = 0;
                              this_1._animations.push({
                                  index: index,
                                  activeFrame: -1,
                                  elapsedTime: 0,
                                  frames: tileprops.tile.animation.map(function (v) {
                                      return {
                                          duration: v.duration,
                                          tileid: v.tileid,
                                          props: tileset.getTileProperties(v.tileid + tileset.desc.firstgid),
                                          startTime: maxTime_1,
                                          endTime: (maxTime_1 += v.duration),
                                      };
                                  }),
                                  maxTime: 0,
                              });
                              this_1._animations[this_1._animations.length - 1].maxTime = maxTime_1;
                          }
                          this_1.textureData[index++] = tileprops.coords.x;
                          this_1.textureData[index++] = tileprops.coords.y;
                          this_1.textureData[index++] = tileprops.imgIndex + imgIndex;
                          this_1.textureData[index++] =
                              (tileprops.flippedX ? TilesetFlags.FlippedHorizontalFlag : 0)
                                  | (tileprops.flippedY ? TilesetFlags.FlippedVerticalFlag : 0)
                                  | (tileprops.flippedAD ? TilesetFlags.FlippedAntiDiagonalFlag : 0);
                          return "continue-dataloop";
                      }
                      imgIndex += tilesets[t].images.length;
                  };
                  var this_1 = this;
                  for (var t = 0; t < tilesets.length; ++t) {
                      var state_1 = _loop_1(t);
                      switch (state_1) {
                          case "continue-dataloop": continue dataloop;
                      }
                  }
              }
              this.textureData[index++] = 255;
              this.textureData[index++] = 255;
              this.textureData[index++] = 255;
              this.textureData[index++] = 255;
          }
      };
      GLTilelayer.prototype.update = function (dt) {
          var needsUpload = false;
          for (var i = 0; i < this._animations.length; ++i) {
              var anim = this._animations[i];
              anim.elapsedTime = (anim.elapsedTime + dt) % anim.maxTime;
              for (var f = 0; f < anim.frames.length; ++f) {
                  var frame = anim.frames[f];
                  if (anim.elapsedTime >= frame.startTime && anim.elapsedTime < frame.endTime) {
                      if (anim.activeFrame !== f) {
                          needsUpload = true;
                          anim.activeFrame = f;
                          this.textureData[anim.index] = frame.props.coords.x;
                          this.textureData[anim.index + 1] = frame.props.coords.y;
                      }
                      break;
                  }
              }
          }
          if (needsUpload)
              this.uploadData();
      };
      GLTilelayer.prototype.upload = function () {
          this.setupTexture();
          this.uploadData(false);
      };
      GLTilelayer.prototype.uploadUniforms = function (shader) {
          var gl = this.gl;
          gl.uniform1f(shader.uniforms.uAlpha, this.alpha);
          gl.uniform1i(shader.uniforms.uRepeatTiles, this._repeatTiles ? 1 : 0);
          gl.uniform2fv(shader.uniforms.uInverseLayerTileCount, this._inverseTileCount);
      };
      GLTilelayer.prototype.uploadData = function (doBind) {
          if (doBind === void 0) { doBind = true; }
          var gl = this.gl;
          if (doBind)
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.desc.width, this.desc.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.textureData);
      };
      GLTilelayer.prototype.setupTexture = function (doBind) {
          if (doBind === void 0) { doBind = true; }
          var gl = this.gl;
          if (doBind)
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          if (this._repeatTiles) {
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
          }
          else {
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          }
      };
      return GLTilelayer;
  }());

  var GLImagelayer = (function () {
      function GLImagelayer(desc, assets) {
          var _this = this;
          this.desc = desc;
          this.type = ELayerType.Imagelayer;
          this.scrollScaleX = 1;
          this.scrollScaleY = 1;
          this.texture = null;
          this.alpha = typeof desc.opacity === 'number' ? desc.opacity : 1.0;
          this._transparentColor = new Float32Array(4);
          parseColorStr(desc.transparentcolor, this._transparentColor);
          loadImage(desc.image, assets, function (errEvent, img) {
              _this.image = img;
              _this.upload();
          });
      }
      GLImagelayer.prototype.glInitialize = function (gl) {
          this.gl = gl;
          this.texture = gl.createTexture();
          this.upload();
      };
      GLImagelayer.prototype.glTerminate = function () {
          if (this.texture) {
              this.gl.deleteTexture(this.texture);
              this.texture = null;
          }
          this.gl = null;
      };
      GLImagelayer.prototype.upload = function () {
          if (!this.gl || !this.image)
              return;
          this.setupTexture();
          this.uploadData(false);
      };
      GLImagelayer.prototype.uploadUniforms = function (shader) {
          if (!this.gl || !this.image)
              return;
          var gl = this.gl;
          gl.uniform1f(shader.uniforms.uAlpha, this.alpha);
          gl.uniform4fv(shader.uniforms.uTransparentColor, this._transparentColor);
          gl.uniform2f(shader.uniforms.uSize, this.image.width, this.image.height);
      };
      GLImagelayer.prototype.uploadData = function (doBind) {
          if (doBind === void 0) { doBind = true; }
          var gl = this.gl;
          if (doBind)
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
      };
      GLImagelayer.prototype.setupTexture = function (doBind) {
          if (doBind === void 0) { doBind = true; }
          var gl = this.gl;
          if (doBind)
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      return GLImagelayer;
  }());

  var backgroundVS = "precision lowp float;\n\nattribute vec2 aPosition;\n\nvoid main()\n{\n    gl_Position = vec4(aPosition, 0.0, 1.0);\n}\n";

  var backgroundFS = "precision lowp float;\n\nuniform vec4 uColor;\n\nvoid main()\n{\n    gl_FragColor = uColor;\n}";

  var tilelayerVS = "precision highp float;\n\nattribute vec2 aPosition;\nattribute vec2 aTexture;\n\nuniform float uInverseTileScale;\n\nuniform vec2 uOffset;\nuniform vec2 uViewportSize;\nuniform vec2 uInverseLayerTileCount;\nuniform vec2 uInverseLayerTileSize;\n\nvarying vec2 vPixelCoord;\nvarying vec2 vTextureCoord;\n\nvoid main()\n{\n    // round offset to the nearest multiple of the inverse scale\n    // this essentially clamps offset to whole \"pixels\"\n    vec2 offset = uOffset + (uInverseTileScale / 2.0);\n    offset -= mod(offset, uInverseTileScale);\n\n    vPixelCoord = (aTexture * uViewportSize) + offset;\n    vTextureCoord = vPixelCoord * uInverseLayerTileCount * uInverseLayerTileSize;\n\n    gl_Position = vec4(aPosition, 0.0, 1.0);\n}\n";

  var tilelayerFS = "precision mediump float;\n\n// TODO: There is a bit too much branching here, need to try and simplify a bit\n\n#pragma define(NUM_TILESETS)\n#pragma define(NUM_TILESET_IMAGES)\n\nvarying vec2 vPixelCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uLayer;\nuniform sampler2D uTilesets[NUM_TILESET_IMAGES];\n\nuniform vec2 uTilesetTileSize[NUM_TILESET_IMAGES];\nuniform vec2 uTilesetTileOffset[NUM_TILESET_IMAGES];\nuniform vec2 uInverseTilesetTextureSize[NUM_TILESET_IMAGES];\nuniform float uAlpha;\nuniform int uRepeatTiles;\n\nconst float Flag_FlippedAntiDiagonal = 2.0;\nconst float Flag_FlippedVertical = 4.0;\nconst float Flag_FlippedHorizontal = 8.0;\nconst vec4 c_one4 = vec4(1.0, 1.0, 1.0, 1.0);\n\n// returns 1.0 if flag is set, 0.0 is not\nfloat hasFlag(float value, float flag)\n{\n    float byteVal = 1.0;\n\n    // early out in trivial cases\n    if (value == 0.0)\n        return 0.0;\n\n    // Only 4 since our highest flag is `8`, so we only need to check 4 bits\n    for (int i = 0; i < 4; ++i)\n    {\n        if (mod(value, 2.0) > 0.0 && mod(flag, 2.0) > 0.0)\n            return 1.0;\n\n        value = floor(value / 2.0);\n        flag = floor(flag / 2.0);\n\n        if (!(value > 0.0 && flag > 0.0))\n            return 0.0;\n    }\n\n    return 0.0;\n}\n\nvec2 getTilesetTileSize(int index)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return uTilesetTileSize[i];\n\n    return vec2(0.0, 0.0);\n}\n\nvec2 getTilesetTileOffset(int index)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return uTilesetTileOffset[i];\n\n    return vec2(0.0, 0.0);\n}\n\nvec4 getColor(int index, vec2 coord)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return texture2D(uTilesets[i], coord * uInverseTilesetTextureSize[i]);\n\n    return vec4(0.0, 0.0, 0.0, 0.0);\n}\n\nvoid main()\n{\n    if (uRepeatTiles == 0 && (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0))\n        discard;\n\n    vec4 tile = texture2D(uLayer, vTextureCoord);\n\n    if (tile == c_one4)\n        discard;\n\n    float flipFlags = floor(tile.w * 255.0);\n\n    // GLSL ES 1.0 doesn't have bitwise flags...\n    // int isFlippedAD = (flipFlags & Flag_FlippedAntiDiagonal) >> 1;\n    // int isFlippedY = (flipFlags & Flag_FlippedVertical) >> 2;\n    // int isFlippedX = (flipFlags & Flag_FlippedHorizontal) >> 3;\n\n    int imgIndex = int(floor(tile.z * 255.0));\n    vec2 tileSize = getTilesetTileSize(imgIndex);\n    vec2 tileOffset = getTilesetTileOffset(imgIndex);\n\n    vec2 flipVec = vec2(hasFlag(flipFlags, Flag_FlippedHorizontal), hasFlag(flipFlags, Flag_FlippedVertical));\n\n    vec2 tileCoord = floor(tile.xy * 255.0);\n\n    // tileOffset.x is 'spacing', tileOffset.y is 'margin'\n    tileCoord.x = (tileCoord.x * tileSize.x) + (tileCoord.x * tileOffset.x) + tileOffset.y;\n    tileCoord.y = (tileCoord.y * tileSize.y) + (tileCoord.y * tileOffset.x) + tileOffset.y;\n\n    vec2 offsetInTile = mod(vPixelCoord, tileSize);\n    vec2 offsetInTileFlipped = abs((tileSize * flipVec) - offsetInTile);\n\n    // if isFlippedAD is set, this will flip the x/y coords\n    if (hasFlag(flipFlags, Flag_FlippedAntiDiagonal) == 1.0)\n    {\n        float x = offsetInTileFlipped.x;\n        offsetInTileFlipped.x = offsetInTileFlipped.y;\n        offsetInTileFlipped.y = x;\n    }\n\n    vec4 color = getColor(imgIndex, tileCoord + offsetInTileFlipped);\n\n    gl_FragColor = vec4(color.rgb, color.a * uAlpha);\n}\n";

  var imagelayerVS = "precision highp float;\n\nattribute vec2 aPosition;\nattribute vec2 aTexture;\n\nuniform float uInverseTileScale;\n\nuniform vec2 uOffset;\nuniform vec2 uSize;\nuniform vec2 uViewportSize;\n// uniform mat3 uProjection;\n\nvarying vec2 vTextureCoord;\n\nvoid main()\n{\n    // squash from [-1, 1] to [0, 1]\n    vec2 position = aPosition;\n    position += 1.0;\n    position /= 2.0;\n\n    // round offset to the nearest multiple of the inverse scale\n    // this essentially clamps offset to whole \"pixels\"\n    vec2 offset = uOffset + (uInverseTileScale / 2.0);\n    offset -= mod(offset, uInverseTileScale);\n\n    // modify offset by viewport & size\n    offset.x -= uViewportSize.x / 2.0;\n    offset.y += (uViewportSize.y / 2.0) - uSize.y;\n\n    // calculate this vertex position based on image size and offset\n    position *= uSize;\n    position += offset;\n\n    // project to clip space\n    position *= (2.0 / uViewportSize);\n\n    vTextureCoord = aTexture;\n    gl_Position = vec4(position, 0.0, 1.0);\n}\n";

  var imagelayerFS = "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float uAlpha;\nuniform vec4 uTransparentColor;\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n\n    if (uTransparentColor.a == 1.0 && uTransparentColor.rgb == color.rgb)\n        discard;\n\n    gl_FragColor = vec4(color.rgb, color.a * uAlpha);\n}\n";

  var GLTilemap = (function () {
      function GLTilemap(gl, desc, assets) {
          this.desc = desc;
          this._layers = [];
          this._tilesets = [];
          this._viewportSize = create$8();
          this._scaledViewportSize = create$8();
          this._inverseLayerTileSize = create$8();
          this._inverseTilesetTextureSize = create$8();
          this._quadVerts = new Float32Array([
              -1, -1, 0, 1,
              1, -1, 1, 1,
              1, 1, 1, 0,
              -1, -1, 0, 1,
              1, 1, 1, 0,
              -1, 1, 0, 0,
          ]);
          this._firstTilelayerUniformUpload = true;
          this._tileScale = 1;
          this._totalTilesetImages = 0;
          this._inverseLayerTileSize[0] = 1 / desc.tilewidth;
          this._inverseLayerTileSize[1] = 1 / desc.tileheight;
          for (var i = 0; i < desc.tilesets.length; ++i) {
              var tileset = new GLTileset(desc.tilesets[i], assets);
              this._totalTilesetImages += tileset.images.length;
              this._tilesets.push(tileset);
          }
          for (var i = 0; i < desc.layers.length; ++i) {
              var l = desc.layers[i];
              switch (l.type) {
                  case 'tilelayer':
                      this._layers.push(new GLTilelayer(l, this.tilesets));
                      break;
                  case 'imagelayer':
                      this._layers.push(new GLImagelayer(l, assets));
                      break;
              }
          }
          this._backgroundColor = new Float32Array(4);
          parseColorStr(desc.backgroundcolor, this._backgroundColor);
          this._tilesetIndices = new Int32Array(this._totalTilesetImages);
          this._tilesetTileSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
          this._tilesetTileOffsetBuffer = new Float32Array(this._totalTilesetImages * 2);
          this._inverseTilesetTextureSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
          this._buildBufferData();
          this.glInitialize(gl);
      }
      Object.defineProperty(GLTilemap.prototype, "layers", {
          get: function () {
              return this._layers;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "tilesets", {
          get: function () {
              return this._tilesets;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "viewportWidth", {
          get: function () {
              return this._viewportSize[0];
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "viewportHeight", {
          get: function () {
              return this._viewportSize[1];
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "scaledViewportWidth", {
          get: function () {
              return this._scaledViewportSize[0];
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "scaledViewportHeight", {
          get: function () {
              return this._scaledViewportSize[1];
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "repeatTiles", {
          set: function (v) {
              for (var i = 0; i < this._layers.length; ++i) {
                  var layer = this._layers[i];
                  if (layer.type === ELayerType.Tilelayer) {
                      layer.repeatTiles = false;
                  }
              }
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(GLTilemap.prototype, "tileScale", {
          get: function () {
              return this._tileScale;
          },
          set: function (scale$$1) {
              if (this._tileScale != scale$$1) {
                  this._tileScale = scale$$1;
                  this._updateViewportSize();
              }
          },
          enumerable: true,
          configurable: true
      });
      GLTilemap.prototype.resizeViewport = function (width, height) {
          if (this._viewportSize[0] != width || this._viewportSize[1] != height) {
              this._viewportSize[0] = width;
              this._viewportSize[1] = height;
              this._updateViewportSize();
          }
      };
      GLTilemap.prototype.glInitialize = function (gl) {
          this.gl = gl;
          this._firstTilelayerUniformUpload = true;
          for (var i = 0; i < this._layers.length; ++i) {
              this._layers[i].glInitialize(gl);
          }
          for (var i = 0; i < this._tilesets.length; ++i) {
              this._tilesets[i].glInitialize(gl);
          }
          this._quadVertBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, this._quadVerts, gl.STATIC_DRAW);
          this._createShaders();
          this._updateViewportSize();
      };
      GLTilemap.prototype.glTerminate = function () {
          var gl = this.gl;
          for (var i = 0; i < this._layers.length; ++i) {
              this._layers[i].glTerminate();
          }
          for (var i = 0; i < this._tilesets.length; ++i) {
              this._tilesets[i].glTerminate();
          }
          if (this._quadVertBuffer) {
              gl.deleteBuffer(this._quadVertBuffer);
              this._quadVertBuffer = null;
          }
          for (var k in this.shaders) {
              var shader = this.shaders[k];
              if (shader) {
                  gl.deleteProgram(shader.program);
                  this.shaders[k] = null;
              }
          }
          this.gl = null;
      };
      GLTilemap.prototype.update = function (dt) {
          for (var i = 0; i < this.layers.length; ++i) {
              var layer = this._layers[i];
              if (layer.type === ELayerType.Tilelayer)
                  layer.update(dt);
          }
      };
      GLTilemap.prototype.draw = function (x, y) {
          if (x === void 0) { x = 0; }
          if (y === void 0) { y = 0; }
          var gl = this.gl;
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
          gl.enableVertexAttribArray(GLTilemap._attribIndices.aPosition);
          gl.enableVertexAttribArray(GLTilemap._attribIndices.aTexture);
          gl.vertexAttribPointer(GLTilemap._attribIndices.aPosition, 2, gl.FLOAT, false, 16, 0);
          gl.vertexAttribPointer(GLTilemap._attribIndices.aTexture, 2, gl.FLOAT, false, 16, 8);
          if (this._backgroundColor[3] > 0) {
              var bgShader = this.shaders.background;
              gl.useProgram(bgShader.program);
              gl.uniform4fv(bgShader.uniforms.uColor, this._backgroundColor);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
          var imgIndex = 0;
          for (var i = 0; i < this._tilesets.length; ++i) {
              var tileset = this._tilesets[i];
              for (var t = 0; t < tileset.textures.length; ++t) {
                  this.gl.activeTexture(gl.TEXTURE1 + imgIndex);
                  this.gl.bindTexture(this.gl.TEXTURE_2D, tileset.textures[t]);
                  imgIndex++;
              }
          }
          gl.activeTexture(gl.TEXTURE0);
          var lastShader = ELayerType.UNKNOWN;
          var activeShader = null;
          var invScale = 1.0 / this._tileScale;
          for (var i = 0; i < this._layers.length; ++i) {
              var layer = this._layers[i];
              var offsetx = layer.desc.offsetx || 0;
              var offsety = layer.desc.offsety || 0;
              if (!layer.desc.visible)
                  continue;
              if (lastShader != layer.type) {
                  activeShader = this._bindShader(layer);
                  lastShader = layer.type;
              }
              switch (layer.type) {
                  case ELayerType.Tilelayer:
                      layer.uploadUniforms(activeShader);
                      gl.uniform2f(activeShader.uniforms.uOffset, -offsetx + (x * layer.scrollScaleX), -offsety + (y * layer.scrollScaleY));
                      break;
                  case ELayerType.Imagelayer:
                      layer.uploadUniforms(activeShader);
                      gl.uniform2f(activeShader.uniforms.uOffset, offsetx + (-x * layer.scrollScaleX), -offsety + (y * layer.scrollScaleY));
                      break;
              }
              gl.bindTexture(gl.TEXTURE_2D, layer.texture);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
      };
      GLTilemap.prototype._bindShader = function (layer) {
          var gl = this.gl;
          switch (layer.type) {
              case ELayerType.Tilelayer:
                  {
                      var tileShader = this.shaders.tilelayer;
                      gl.useProgram(tileShader.program);
                      if (this._firstTilelayerUniformUpload) {
                          this._firstTilelayerUniformUpload = false;
                          gl.uniform1i(tileShader.uniforms.uLayer, 0);
                          gl.uniform2fv(tileShader.uniforms.uInverseLayerTileSize, this._inverseLayerTileSize);
                          gl.uniform1iv(tileShader.uniforms.uTilesets, this._tilesetIndices);
                          gl.uniform2fv(tileShader.uniforms.uTilesetTileSize, this._tilesetTileSizeBuffer);
                          gl.uniform2fv(tileShader.uniforms.uTilesetTileOffset, this._tilesetTileOffsetBuffer);
                          gl.uniform2fv(tileShader.uniforms.uInverseTilesetTextureSize, this._inverseTilesetTextureSizeBuffer);
                      }
                      return tileShader;
                  }
              case ELayerType.Imagelayer:
                  {
                      var imageShader = this.shaders.imagelayer;
                      gl.useProgram(imageShader.program);
                      return imageShader;
                  }
          }
      };
      GLTilemap.prototype._updateViewportSize = function () {
          this._scaledViewportSize[0] = this._viewportSize[0] / this._tileScale;
          this._scaledViewportSize[1] = this._viewportSize[1] / this._tileScale;
          var gl = this.gl;
          var tileShader = this.shaders.tilelayer;
          gl.useProgram(tileShader.program);
          gl.uniform2fv(tileShader.uniforms.uViewportSize, this._scaledViewportSize);
          gl.uniform1f(tileShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);
          var imageShader = this.shaders.imagelayer;
          gl.useProgram(imageShader.program);
          gl.uniform2fv(imageShader.uniforms.uViewportSize, this._scaledViewportSize);
          gl.uniform1f(imageShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);
      };
      GLTilemap.prototype._buildBufferData = function () {
          for (var i = 0; i < this._tilesetIndices.length; ++i)
              this._tilesetIndices[i] = i + 1;
          var imgIndex = 0;
          for (var i = 0; i < this._tilesets.length; ++i) {
              var tileset = this._tilesets[i];
              for (var s = 0; s < tileset.images.length; ++s) {
                  this._tilesetTileSizeBuffer[(imgIndex * 2)] = tileset.desc.tilewidth;
                  this._tilesetTileSizeBuffer[(imgIndex * 2) + 1] = tileset.desc.tileheight;
                  this._tilesetTileOffsetBuffer[(imgIndex * 2)] = tileset.desc.spacing;
                  this._tilesetTileOffsetBuffer[(imgIndex * 2) + 1] = tileset.desc.margin;
                  var imgDesc = tileset.desc.tiles && tileset.desc.tiles[s] ? tileset.desc.tiles[s] : tileset.desc;
                  this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / imgDesc.imagewidth;
                  this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / imgDesc.imageheight;
                  imgIndex++;
              }
          }
      };
      GLTilemap.prototype._createShaders = function () {
          var tilelayerFragShader = tilelayerFS
              .replace('#pragma define(NUM_TILESETS)', "#define NUM_TILESETS " + this._tilesets.length)
              .replace('#pragma define(NUM_TILESET_IMAGES)', "#define NUM_TILESET_IMAGES " + this._totalTilesetImages);
          this.shaders = {
              background: new GLProgram(this.gl, backgroundVS, backgroundFS, GLTilemap._attribIndices),
              tilelayer: new GLProgram(this.gl, tilelayerVS, tilelayerFragShader, GLTilemap._attribIndices),
              imagelayer: new GLProgram(this.gl, imagelayerVS, imagelayerFS, GLTilemap._attribIndices),
          };
      };
      GLTilemap._attribIndices = {
          aPosition: 0,
          aTexture: 1,
      };
      return GLTilemap;
  }());

  exports.Tilemap = GLTilemap;
  exports.Tileset = GLTileset;
  exports.Tilelayer = GLTilelayer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
