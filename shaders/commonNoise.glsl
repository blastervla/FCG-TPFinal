#define MAX_FBM_ITERATIONS 30

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

struct NoiseParams {
  float seed;
  float persistance;
  float lacunarity;
  float scale;
  float redistribution;
  int octaves;
  bool turbulence;
  bool ridge;
};

float gln_map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float gln_normalize(float v) { return gln_map(v, -1.0, 1.0, 0.0, 1.0); }