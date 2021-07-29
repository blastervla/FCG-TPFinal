in vec3 pos;
in vec3 normal;

uniform mat4 mvp;
uniform int seed;
uniform int layerNumber;
uniform float scale;
uniform float persistence;
uniform float lacunarity;
uniform float multiplier;

uniform float depth;
uniform float depthMultiplier;
uniform float oceanSmoothing;

out vec4 texCoord;
out vec3 normCoord;
out vec4 vertCoord;

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

vec3 spherizeWithNoise(vec3 position) {
    float continent = simpleNoise(
        seed, position, layerNumber, scale / 1000.0, 
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

    float finalHeight = 1.0 + (continent /*+ mountains*/) * 0.01;

    return normalizeWithRespectTo(vec3(0.0, 0.0, 0.0), position, finalHeight);
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
                                       : vec3(0.0, -v.z, v.y));
}

vec3 calcNormal(vec3 newPos) {
  float offset = 20.0 / 256.0;
  vec3 tangent = orthogonal(normal);
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 neighbour1 = pos + tangent * offset;
  vec3 neighbour2 = pos + bitangent * offset;
  vec3 displacedNeighbour1 = spherizeWithNoise(neighbour1);
  vec3 displacedNeighbour2 = spherizeWithNoise(neighbour2);
  // https://i.ya-webdesign.com/images/vector-normals-tangent-16.png
  vec3 displacedTangent = displacedNeighbour1 - newPos;
  vec3 displacedBitangent = displacedNeighbour2 - newPos;
  // https://upload.wikimedia.org/wikipedia/commons/d/d2/Right_hand_rule_cross_product.svg
  return normalize(cross(displacedTangent, displacedBitangent));
}


void main()
{ 
    vec3 drawPos = spherizeWithNoise(pos);
    
    gl_Position = mvp * vec4(drawPos,1);
    texCoord = mvp * vec4(normalizeWithRespectTo(vec3(0.0, 0.0, 0.0), pos, atmosphereHeight), 1);
    normCoord = calcNormal(drawPos);
    vertCoord = vec4(drawPos, 1);
}