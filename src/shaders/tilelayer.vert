precision highp float;

attribute vec2 aPosition;
attribute vec2 aTexture;

uniform vec2 uOffset;
uniform vec2 uViewportSize;
uniform vec2 uInverseLayerTextureSize;
uniform vec2 uInverseLayerTileSize;

varying vec2 vPixelCoord;
varying vec2 vTextureCoord;

void main()
{
    vPixelCoord = (aTexture * uViewportSize) + uOffset;
    vTextureCoord = vPixelCoord * uInverseLayerTextureSize * uInverseLayerTileSize;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}
