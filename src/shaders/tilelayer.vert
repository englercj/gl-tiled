precision highp float;

attribute vec2 aPosition;
attribute vec2 aTexture;

varying vec2 vPixelCoord;
varying vec2 vTexureCoord;

uniform vec2 uViewportOffset;
uniform vec2 uViewportSize;
uniform vec2 uInverseLayerTextureSize;
uniform vec2 uInverseLayerTileSize;

void main()
{
    vPixelCoord = (aTexture * uViewportSize) + uViewportOffset;
    vTexureCoord = vPixelCoord * uInverseLayerTextureSize * uInverseLayerTileSize;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}
