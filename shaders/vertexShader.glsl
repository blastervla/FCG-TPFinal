attribute vec3 pos;
attribute vec2 textureCoordinates;
attribute vec3 normal;

uniform mat4 mvp;
uniform int shouldSwapYZ;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

void main()
{ 
    vec3 drawPos = pos;
    // float noise = gln_perlin(pos);
    if (shouldSwapYZ == 1) {
        drawPos = vec3(pos[0],pos[2],pos[1]);
    }
        
    // gl_Position = mvp * vec4(drawPos + noise * normal,1);
    gl_Position = mvp * vec4(drawPos,1);
    texCoord = textureCoordinates;
    normCoord = normal;
    vertCoord = vec4(pos, 1);
}