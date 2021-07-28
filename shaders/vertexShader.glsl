attribute vec3 pos;
attribute vec2 textureCoordinates;
attribute vec3 normal;

uniform mat4 mvp;
/*uniform*/ float radius = 10.0;
/*uniform*/ float seed = 1.0;
/*uniform*/ float layerNumber = 3.0;
/*uniform*/ float scale = 100.0;
/*uniform*/ float persistence = 0.25;
/*uniform*/ float lacunarity = 0.25;
/*uniform*/ float multiplier = 1.0;

/*uniform*/ float depth = 5.5;
/*uniform*/ float depthMultiplier = 16.5;
/*uniform*/ float oceanSmoothing = 2.0;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

vec3 normalizeWithRespectTo(vec3 a, vec3 b, float length) {
    // get the distance between a and b along the x and y axes
    float dx = b.x - a.x;
    float dy = b.y - a.y;
    float dz = b.z - a.z;
    
    // right now, sqrt(dx^2 + dy^2) = distance(a,b).
    // we want to modify them so that sqrt(dx^2 + dy^2) = the given length.
    dx = dx * length / distance(a,b);
    dy = dy * length / distance(a,b);
    dz = dy * length / distance(a,b);
    
    return vec3(a.x + dx, a.y + dy, a.z + dz);
}

vec3 spherizeWithNoise() {
    float continent = simpleNoise(
        pos * seed, layerNumber, scale / 1000.0, 
        persistence, lacunarity, multiplier
    );

    float ocean = -depth + continent * 0.15;
    continent = smoothMax(continent, ocean, oceanSmoothing);
    continent *= continent < 0.0 ? 1.0 + depthMultiplier : 1.0;
    continent *= -1.0;

    // let mountainMask = noiseMachine.blend(0, mountainOpts.blend, noiseMachine.simpleNoise(
    //     this.vertices[i], mountainOpts.numLayers, mountainOpts.scale, 
    //     mountainOpts.persistence, mountainOpts.lacunarity, mountainOpts.multiplier
    // ));
    // let mountains = noiseMachine.smoothedRidgidNoise(
    //     this.vertices[i], mountainOpts.offset, mountainOpts.numLayers, 
    //     mountainOpts.persistence, mountainOpts.lacunarity, mountainOpts.scale, 
    //     mountainOpts.multiplier, mountainOpts.power, mountainOpts.gain, mountainOpts.verticalShift
    // ) * mountainMask;

    float finalHeight = radius + (continent /*+ mountains*/) * radius * 0.01;

    return normalizeWithRespectTo(vec3(0.0, 0.0, 0.0), pos, finalHeight);
}

void main()
{ 
    vec3 drawPos = spherizeWithNoise();
    
    gl_Position = mvp * vec4(drawPos,1);
    texCoord = textureCoordinates;
    normCoord = normal;
    vertCoord = vec4(pos, 1);
}