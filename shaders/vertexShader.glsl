attribute vec3 pos;
attribute vec2 textureCoordinates;
attribute vec3 normal;

uniform mat4 mvp;

varying vec2 texCoord;
varying vec3 normCoord;
varying vec4 vertCoord;

// varying vec2 vUv;
// varying vec3 vViewPosition;

// struct MaskOpts {
uniform float maskScale;
// };

// struct WorldOpts {
uniform float planetHeight;
uniform float seaLevel;
uniform float planetNoiseOpacity;
// };

uniform NoiseParams ridgeParams;
uniform NoiseParams params;
// uniform MaskOpts uMaskOpts;
// uniform WorldOpts uWorldOpts;

varying float vHeight;

vec3 displace(vec3 point) {

  vec3 p = point;

  float seed = params.seed;
  float mask = gln_normalize(gln_simplex(
      (point + ((seed * 100.0) + (seed * 1000.0))) * maskScale));

  NoiseParams opts1 = params;
  opts1.redistribution = 1.0;
  float f_simplex = gln_normalize(gln_sfbm(point, opts1));

  NoiseParams opts2 = ridgeParams;
  opts2.redistribution = 1.0;
  float f_ridge = gln_normalize(gln_sfbm(point, opts2));

  float blend = gln_blend(vec4(f_ridge),
                          vec4(f_simplex * planetNoiseOpacity), gln_ADD)
                    .x;
  float f = blend;

  blend = gln_blend(vec4(f), vec4(mask), gln_MULTIPLY).x;
  f = blend;

  if (f < seaLevel)
    f = seaLevel;

  f *= planetHeight;
  vHeight = f;
  p = point + (normal * (f));

  return p;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
                                       : vec3(0.0, -v.z, v.y));
}

vec3 calcNormal(vec3 pos) {

  float offset = 20.0 / 256.0;
  vec3 tangent = orthogonal(normal);
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 neighbour1 = pos + tangent * offset;
  vec3 neighbour2 = pos + bitangent * offset;
  vec3 displacedNeighbour1 = displace(neighbour1);
  vec3 displacedNeighbour2 = displace(neighbour2);
  // https://i.ya-webdesign.com/images/vector-normals-tangent-16.png
  vec3 displacedTangent = displacedNeighbour1 - pos;
  vec3 displacedBitangent = displacedNeighbour2 - pos;
  // https://upload.wikimedia.org/wikipedia/commons/d/d2/Right_hand_rule_cross_product.svg
  return normalize(cross(displacedTangent, displacedBitangent));
}


void main()
{ 
    // float noise = gln_perlin(pos);
        
    // gl_Position = mvp * vec4(drawPos + noise * normal,1);
    gl_Position = mvp * vec4(displace(pos), 1);
    
    vec3 norm = calcNormal(pos);
    texCoord = textureCoordinates;
    normCoord = norm;
    vertCoord = vec4(pos, 1);
}