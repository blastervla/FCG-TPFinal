attribute vec3 pos;
attribute vec3 normal;

uniform mat4 mvp;

varying vec3 normCoord;
varying vec4 vertCoord;

const float atmosphereHeight = 1.25;

vec3 normalizeWithRespectTo(vec3 a, vec3 b, float length) {
    // get the distance between a and b along the x and y axes
    float dx = b.x - a.x;
    float dy = b.y - a.y;
    float dz = b.z - a.z;
    
    // right now, sqrt(dx^2 + dy^2) = distance(a,b).
    // we want to modify them so that sqrt(dx^2 + dy^2) = the given length.
    dx = dx * length / distance(a,b);
    dy = dy * length / distance(a,b);
    dz = dz * length / distance(a,b);
    
    return vec3(a.x + dx, a.y + dy, a.z + dz);
}

void main()
{ 
    vec3 drawPos = normalizeWithRespectTo(vec3(0.0, 0.0, 0.0), pos, atmosphereHeight);
    
    gl_Position = mvp * vec4(drawPos,1);
    normCoord = normal;
    vertCoord = vec4(pos, 1);
}