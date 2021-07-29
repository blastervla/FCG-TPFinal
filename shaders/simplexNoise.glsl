// const float F3 = 1.0 / 3.0;
// const float G3 = 1.0 / 6.0;
// int perm[512];
// vec3 gradP[512];
// int p[256] = int[] (151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180);
// vec3 grad3[12] = vec3[] (vec3(1.0, 1.0, 0.0), vec3(-1.0, 1.0, 0.0), vec3(1.0, -1.0, 0.0), vec3(-1.0, -1.0, 0.0), vec3(1.0, 0.0, 1.0), vec3(-1.0, 0.0, 1.0), vec3(1.0, 0.0, -1.0), vec3(-1.0, 0.0, -1.0), vec3(0.0, 1.0, 1.0), vec3(0.0, -1.0, 1.0), vec3(0.0, 1.0, -1.0), vec3(0.0, -1.0, -1.0));

// void setSeed(int seed) {
//     if(seed > 0 && seed < 1) {
//         // Scale the seed out
//         seed *= 65536;
//     }

//     if(seed < 256) {
//         seed |= seed << 8;
//     }

//     for(int i = 0; i < 256; i++) {
//         int v;
//         if((i & 1) != 0) {
//             v = p[i] ^ (seed & 255);
//         } else {
//             v = p[i] ^ ((seed >> 8) & 255);
//         }

//         perm[i] = perm[i + 256] = v;
//         gradP[i] = gradP[i + 256] = grad3[v % 12];
//     }
// }

// float snoise(int seed, vec3 pos) {
//     setSeed(seed);
//     float n0, n1, n2, n3; // Noise contributions from the four corners

//     // Skew the input space to determine which simplex cell we're in
//     float s = (pos.x + pos.y + pos.z) * F3; // Hairy factor for 2D
//     int i = int(floor(pos.x + s));
//     int j = int(floor(pos.y + s));
//     int k = int(floor(pos.z + s));

//     float t = float(i + j + k) * G3;
//     float x0 = pos.x - float(i) + t; // The x,y distances from the cell origin, unskewed.
//     float y0 = pos.y - float(j) + t;
//     float z0 = pos.z - float(k) + t;

//     // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
//     // Determine which simplex we are in.
//     int i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
//     int i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
//     if(x0 >= y0) {
//         if(y0 >= z0) {
//             i1 = 1;
//             j1 = 0;
//             k1 = 0;
//             i2 = 1;
//             j2 = 1;
//             k2 = 0;
//         } else if(x0 >= z0) {
//             i1 = 1;
//             j1 = 0;
//             k1 = 0;
//             i2 = 1;
//             j2 = 0;
//             k2 = 1;
//         } else {
//             i1 = 0;
//             j1 = 0;
//             k1 = 1;
//             i2 = 1;
//             j2 = 0;
//             k2 = 1;
//         }
//     } else {
//         if(y0 < z0) {
//             i1 = 0;
//             j1 = 0;
//             k1 = 1;
//             i2 = 0;
//             j2 = 1;
//             k2 = 1;
//         } else if(x0 < z0) {
//             i1 = 0;
//             j1 = 1;
//             k1 = 0;
//             i2 = 0;
//             j2 = 1;
//             k2 = 1;
//         } else {
//             i1 = 0;
//             j1 = 1;
//             k1 = 0;
//             i2 = 1;
//             j2 = 1;
//             k2 = 0;
//         }
//     }
//     // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
//     // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
//     // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
//     // c = 1/6.
//     float x1 = x0 - float(i1) + G3; // Offsets for second corner
//     float y1 = y0 - float(j1) + G3;
//     float z1 = z0 - float(k1) + G3;

//     float x2 = x0 - float(i2) + 2.0 * G3; // Offsets for third corner
//     float y2 = y0 - float(j2) + 2.0 * G3;
//     float z2 = z0 - float(k2) + 2.0 * G3;

//     float x3 = x0 - 1.0 + 3.0 * G3; // Offsets for fourth corner
//     float y3 = y0 - 1.0 + 3.0 * G3;
//     float z3 = z0 - 1.0 + 3.0 * G3;

//     // Work out the hashed gradient indices of the four simplex corners
//     i &= 255;
//     j &= 255;
//     k &= 255;
//     vec3 gi0 = gradP[i + perm[j + perm[k]]];
//     vec3 gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
//     vec3 gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
//     vec3 gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

//     // Calculate the contribution from the four corners
//     float t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
//     if(t0 < 0.0) {
//         n0 = 0.0;
//     } else {
//         t0 *= t0;
//         n0 = t0 * t0 * dot(gi0, vec3(x0, y0, z0));  // (x,y) of this.grad3 used for 2D gradient
//     }
//     float t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
//     if(t1 < 0.0) {
//         n1 = 0.0;
//     } else {
//         t1 *= t1;
//         n1 = t1 * t1 * dot(gi1, vec3(x1, y1, z1));
//     }
//     float t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
//     if(t2 < 0.0) {
//         n2 = 0.0;
//     } else {
//         t2 *= t2;
//         n2 = t2 * t2 * dot(gi2, vec3(x2, y2, z2));
//     }
//     float t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
//     if(t3 < 0.0) {
//         n3 = 0.0;
//     } else {
//         t3 *= t3;
//         n3 = t3 * t3 * dot(gi3, vec3(x3, y3, z3));
//     }
//     // Add contributions from each corner to get the final noise value.
//     // The result is scaled to return values in the interval [-1,1].
//     return 32.0 * (n0 + n1 + n2 + n3);
// }

// float snoise(int seed, vec3 v, int numLayers, float frequency, float persistence, float lacunarity, float multiplier) {
//   v += (seed * 100.0);
//   float redistribution = opts.redistribution;

//   float result = 0.0;
//   float amplitude = 1.0;
//   float maximum = amplitude;

//   for (int i = 0; i < MAX_FBM_ITERATIONS; i++) {
//     if (i >= numLayers)
//       break;

//     vec3 p = v * frequency * opts.scale;

//     float noiseVal = gln_simplex(p);

//     result += noiseVal * amplitude;

//     frequency *= lacunarity;
//     amplitude *= persistance;
//     maximum += amplitude;
//   }

//   float redistributed = pow(result, redistribution);
//   return redistributed / maximum;
// }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
    i = mod(i, 289.0);
    vec4 p = _permute(_permute(_permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y +
        vec4(0.0, i1.y, i2.y, 1.0)) +
        i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0 / 7.0; // N=7
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z); //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
    vec4 norm = _taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 *
        dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float simpleNoise(int seed, vec3 pos, int numLayers, float frequency, float persistence, float lacunarity, float multiplier) {
    float noiseSum = 0.0;
    float amplitude = 1.0;
    for(int i = 0; i < 10; i++) {
        if(i >= numLayers) {
            break;
        }
        noiseSum += snoise(pos + float(seed) * frequency) * amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return noiseSum * multiplier;
}