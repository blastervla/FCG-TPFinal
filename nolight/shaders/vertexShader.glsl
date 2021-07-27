attribute vec3 pos;
attribute vec3 normal;
attribute vec2 textureCoordinates;
uniform mat4 mvp;
uniform int shouldSwapYZ;
varying vec2 texCoord;

void main()
{ 
    vec3 drawPos = pos;
    float noise = gln_perlin(pos);
    if (shouldSwapYZ == 1) {
        drawPos = vec3(pos[0],pos[2],pos[1]);
    }
        
    gl_Position = mvp * vec4(drawPos + noise * normal,1);
    texCoord = textureCoordinates;
}