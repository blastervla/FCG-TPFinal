attribute vec3 pos;
attribute vec2 textureCoordinates;
attribute vec3 normal;

uniform mat4 mvp;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

void main()
{ 
    vec3 drawPos = pos;
    
    gl_Position = mvp * vec4(drawPos,1);
    texCoord = textureCoordinates;
    normCoord = normal;
    vertCoord = vec4(pos, 1);
}