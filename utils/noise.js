class Grad {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    dot3(x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    }
}

class Simplex {
    constructor(seed) {
        this.F3 = 1 / 3;
        this.G3 = 1 / 6;
        this.perm = new Array(512);
        this.gradP = new Array(512);
        this.p = [151, 160, 137, 91, 90, 15,
            131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
            251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
            49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ];
        this.grad3 = [
            new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
            new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
            new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)
        ];
        this.seed(seed);
    }

    seed(seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = this.p[i] ^ (seed & 255);
            } else {
                v = this.p[i] ^ ((seed >> 8) & 255);
            }

            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
        }
    }

    noise(xin, yin, zin) {
        var n0, n1, n2, n3; // Noise contributions from the four corners

        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * this.F3; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);

        var t = (i + j + k) * this.G3;
        var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin - j + t;
        var z0 = zin - k + t;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + this.G3; // Offsets for second corner
        var y1 = y0 - j1 + this.G3;
        var z1 = z0 - k1 + this.G3;

        var x2 = x0 - i2 + 2 * this.G3; // Offsets for third corner
        var y2 = y0 - j2 + 2 * this.G3;
        var z2 = z0 - k2 + 2 * this.G3;

        var x3 = x0 - 1 + 3 * this.G3; // Offsets for fourth corner
        var y3 = y0 - 1 + 3 * this.G3;
        var z3 = z0 - 1 + 3 * this.G3;

        // Work out the hashed gradient indices of the four simplex corners
        i &= 255;
        j &= 255;
        k &= 255;
        var gi0 = this.gradP[i + this.perm[j + this.perm[k]]];
        var gi1 = this.gradP[i + i1 + this.perm[j + j1 + this.perm[k + k1]]];
        var gi2 = this.gradP[i + i2 + this.perm[j + j2 + this.perm[k + k2]]];
        var gi3 = this.gradP[i + 1 + this.perm[j + 1 + this.perm[k + 1]]];

        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of this.grad3 used for 2D gradient
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) {
            n3 = 0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 32 * (n0 + n1 + n2 + n3);
    };
}

// class NoiseV2 {
//     _permute(x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
//     _taylorInvSqrt(r) { return 1.79284291400159 - 0.85373472095314 * r; }

//     gln_normalize(v) { return gln_map(v, -1.0, 1.0, 0.0, 1.0); }

//     gln_map(value, min1, max1, min2, max2) {
//         return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
//     }

//     step(A, B) {
//         return new Vertex(
//             A.x <= B.x ? 1 : 0,
//             A.y <= B.y ? 1 : 0,
//             A.z <= B.z ? 1 : 0,
//         );
//     }

//     gln_simplex(v) {
//     const C = [1.0 / 6.0, 1.0 / 3.0];
//     const D = [0.0, 0.5, 1.0, 2.0];
  
//     // First corner
//     let i = v.plus(v.dot(new Vertex(C[1], C[1], C[1]))).floor();
//     let x0 = v.minus(i.plus(i.dot(new Vertex(C[0], C[0], C[0]))));
  
//     // Other corners
//     let g = this.step(x0.yzx, x0.xyz);
//     let l = new Vertex(1, 1, 1).minus(g);
//     let i1 = new Vertex(Math.min(g.x, l.z), Math.min(g.y, l.x), Math.min(g.z, l.y));
//     let i2 = new Vertex(Math.max(g.x, l.z), Math.max(g.y, l.x), Math.max(g.z, l.y));
  
//     //  x0 = x0 - 0. + 0.0 * C
//     let x1 = x0.minus(i1).plus(new Vertex(C[0], C[0], C[0]).times(1.0));
//     let x2 = x0.minus(i2).plus(new Vertex(C[0], C[0], C[0]).times(2.0));
//     let x3 = x0.minus(new Vertex(1,1,1)).plus(new Vertex(C[0], C[0], C[0]).times(3.0));
  
//     // Permutations
//     i = i.mod(289);
//     let p = this._permute(this._permute(this._permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y +
//                                vec4(0.0, i1.y, i2.y, 1.0)) +
//                       i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
//     // Gradients
//     // ( N*N points uniformly over a square, mapped onto an octahedron.)
//     float n_ = 1.0 / 7.0; // N=7
//     vec3 ns = n_ * D.wyz - D.xzx;
  
//     vec4 j = p - 49.0 * floor(p * ns.z * ns.z); //  mod(p,N*N)
  
//     vec4 x_ = floor(j * ns.z);
//     vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)
  
//     vec4 x = x_ * ns.x + ns.yyyy;
//     vec4 y = y_ * ns.x + ns.yyyy;
//     vec4 h = 1.0 - abs(x) - abs(y);
  
//     vec4 b0 = vec4(x.xy, y.xy);
//     vec4 b1 = vec4(x.zw, y.zw);
  
//     vec4 s0 = floor(b0) * 2.0 + 1.0;
//     vec4 s1 = floor(b1) * 2.0 + 1.0;
//     vec4 sh = -step(h, vec4(0.0));
  
//     vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
//     vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
//     vec3 p0 = vec3(a0.xy, h.x);
//     vec3 p1 = vec3(a0.zw, h.y);
//     vec3 p2 = vec3(a1.xy, h.z);
//     vec3 p3 = vec3(a1.zw, h.w);
  
//     // Normalise gradients
//     vec4 norm =
//         _taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
//     p0 *= norm.x;
//     p1 *= norm.y;
//     p2 *= norm.z;
//     p3 *= norm.w;
  
//     // Mix final noise value
//     vec4 m =
//         max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
//     m = m * m;
//     return 42.0 *
//            dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
//   }
// }

class Noise {
    constructor(seed) {
        this.seed = seed;
        this.s = new Simplex(this.seed);
    }

    simpleNoise(pos, numLayers, scale, persistence, lacunarity, multiplier) {
        let noiseSum = 0;
        let amplitude = 1;
        let frequency = scale;
        for (let i = 0; i < numLayers; i++) {
            noiseSum += this.s.noise(pos.x * frequency, pos.y * frequency, pos.z * frequency) * amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return noiseSum * multiplier;
    }

    // Smooth maximum of two values, controlled by smoothing factor k
    // When k = 0, this behaves identically to max(a, b)
    smoothMax(a, b, k) {
        k = Math.min(0, -k);
        let h = Math.max(0, Math.min(1, (b - a + k) / (2 * k)));
        return a * h + b * (1 - h) - k * h * (1 - h);
    }

    smoothstep(a, b, x)
    {
        let t = this.saturate((x - a)/(b - a));
        return t*t*(3.0 - (2.0*t));
    }

    blend(startHeight, blendDst, height) {
        return this.smoothstep(startHeight - blendDst / 2, startHeight + blendDst / 2, height);
    }

    saturate(num) {
        return Math.min(Math.max(num, 0), 1);
    }

    ridgidNoise(pos, offset, numLayers, persistence, lacunarity, scale, multiplier,
        power, gain, verticalShift) {
        // Sum up noise layers
        let noiseSum = 0;
        let amplitude = 1;
        let frequency = scale;
        let ridgeWeight = 1;

        for (let i = 0; i < numLayers; i++) {
            let noiseVal = 1 - Math.abs(this.s.noise(
                pos.x * frequency + offset, pos.y * frequency + offset, pos.z * frequency + offset
            ));
            noiseVal = Math.pow(Math.abs(noiseVal), power);
            noiseVal *= ridgeWeight;
            ridgeWeight = this.saturate(noiseVal * gain);

            noiseSum += noiseVal * amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return noiseSum * multiplier + verticalShift;
    }

    smoothedRidgidNoise(pos, offset, numLayers, persistence, lacunarity, scale, multiplier,
        power, gain, verticalShift) {
        let sphereNormal = pos.normalized();
        let axisA = sphereNormal.cross(new Vertex(0, 1, 0));
        let axisB = sphereNormal.cross(axisA);

        let offsetDst = offset * 0.01;
        let sample0 = this.ridgidNoise(pos, offset, numLayers, persistence, 
            lacunarity, scale, multiplier, power, gain, verticalShift);
        let sample1 = this.ridgidNoise(pos.minus(axisA).times(offsetDst), offset, numLayers, persistence, 
            lacunarity, scale, multiplier, power, gain, verticalShift);
        let sample2 = this.ridgidNoise(pos.plus(axisA).times(offsetDst), offset, numLayers, persistence, 
            lacunarity, scale, multiplier, power, gain, verticalShift);
        let sample3 = this.ridgidNoise(pos.minus(axisB).times(offsetDst), offset, numLayers, persistence, 
            lacunarity, scale, multiplier, power, gain, verticalShift);
        let sample4 = this.ridgidNoise(pos.plus(axisB).times(offsetDst), offset, numLayers, persistence, 
            lacunarity, scale, multiplier, power, gain, verticalShift);
        return (sample0 + sample1 + sample2 + sample3 + sample4) / 5;
    }

}