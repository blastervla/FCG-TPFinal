class vec3 {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    plus(other) {
        return new vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    minus(other) {
        return new vec3(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
    }

    scalarPlus(n) {
        return new vec3(this.x + n, this.y + n, this.z + n);
    }

    times(scalar) {
        return new vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    product(other) {
        return new vec3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    floor() {
        return new vec3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    }

    step(other) {
        return new vec3(other.x < this.x ? 0.0 : 1.0, other.y < this.y ? 0.0 : 1.0, other.z < this.z ? 0.0 : 1.0);
    }

    min(other) {
        return new vec3(Math.min(this.x, other.x), Math.min(this.y, other.y), Math.min(this.z, other.z));
    }

    max(other) {
        return new vec3(Math.max(this.x, other.x), Math.max(this.y, other.y), Math.max(this.z, other.z));
    }
}

class vec4 {
    constructor(x, y, z, w) {
        this.x = x; this.y = y; this.z = z; this.w = w;
    }

    plus(other) {
        return new vec4(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
    }

    minus(other) {
        return new vec4(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
    }

    scalarPlus(n) {
        return new vec4(this.x + n, this.y + n, this.z + n, this.w + n);
    }

    scalarMinus(n) {
        return new vec4(this.x - n, this.y - n, this.z - n, this.w - n);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    times(scalar) {
        return new vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }
    
    product(other) {
        return new vec4(this.x * other.x, this.y * other.y, this.z * other.z, this.w * other.w);
    }

    floor() {
        return new vec4(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z), Math.floor(this.w));
    }

    abs() {
        return new vec4(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z), Math.abs(this.w));
    }

    step(other) {
        return new vec4(other.x < this.x ? 0.0 : 1.0, other.y < this.y ? 0.0 : 1.0, 
                        other.z < this.z ? 0.0 : 1.0, other.w < this.w ? 0.0 : 1.0);
    }

    max(other) {
        return new vec4(Math.max(this.x, other.x), Math.max(this.y, other.y),
                        Math.max(this.z, other.z), Math.max(this.w, other.w));
    }
}

function _permute(v) { 
    return new vec4(
        (((v.x * 34.0) + 1.0) * v.x) % 289,
        (((v.y * 34.0) + 1.0) * v.y) % 289,
        (((v.z * 34.0) + 1.0) * v.z) % 289,
        (((v.w * 34.0) + 1.0) * v.w) % 289,
    )
    return mod(((x * 34.0) + 1.0) * x, 289.0); 
}
function _taylorInvSqrt(r) { 
    return new vec4(
        1.79284291400159 - 0.85373472095314 * r.x, 
        1.79284291400159 - 0.85373472095314 * r.y, 
        1.79284291400159 - 0.85373472095314 * r.z, 
        1.79284291400159 - 0.85373472095314 * r.w,
    ); 
}

class Simplex {
    constructor() {}

    noise(v) {
        let C = [1.0 / 6.0, 1.0 / 3.0];
        let D = new vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        let i = v.scalarPlus(v.dot(new vec3(C[1], C[1], C[1]))).floor();
        let x0 = v.minus(i).scalarPlus(i.dot(new vec3(C[0], C[0], C[0])));

        // Other corners
        let g = new vec3(x0.y, x0.z, x0.x).step(x0);
        let l = new vec3(1.0, 1.0, 1.0).minus(g);
        let i1 = g.min(new vec3(l.z, l.x, l.y));
        let i2 = g.max(new vec3(l.z, l.x, l.y));

    //  x0 = x0 - 0. + 0.0 * C
        let x1 = x0.minus(i1).plus(new vec3(C[0], C[0], C[0]));
        let x2 = x0.minus(i2).plus(new vec3(2 * C[0], 2 * C[0], 2 * C[0]));
        let x3 = x0.minus(new vec3(1, 1, 1)).plus(new vec3(3 * C[0], 3 * C[0], 3 * C[0]));

    // Permutations
        i = new vec3(i.x % 289, i.y % 289, i.z % 289);
        let p = _permute(
            _permute(
                _permute(
                    new vec4(i.z, i1.z + i.z, i2.z + i.z, 1.0 + i.z)
                )
                .scalarPlus(i.y)
                .plus(new vec4(0.0, i1.y, i2.y, 1.0))
            ).scalarPlus(i.x).plus(new vec4(0.0, i1.x, i2.x, 1.0))
        );

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
        let n_ = 1.0 / 7.0; // N=7
        let ns = new vec3(n_ * D.w, n_ * D.y, n_ * D.z).minus(new vec3(D.x, D.z, D.x));

        let j = p.minus(new vec4(49, 49, 49, 49).product(p.times(ns.z).times(ns.z).floor())); //  mod(p,N*N)

        let x_ = j.times(ns.z).floor();
        let y_ = j.minus(x_.times(7.0)).floor(); // mod(j,N)

        let x = new vec4(ns.y, ns.y, ns.y, ns.y).plus(x_.times(ns.x));
        let y = new vec4(ns.y, ns.y, ns.y, ns.y).plus(y_.times(ns.x));
        let aux = x.abs().minus(y.abs());
        let h = new vec4(1, 1, 1, 1).minus(x.abs()).minus(y.abs());

        let b0 = new vec4(x.x, x.y, y.x, y.y);
        let b1 = new vec4(x.z, x.w, y.z, y.w);

        let s0 = b0.floor().times(2.0).scalarPlus(1.0);
        let s1 = b1.floor().times(2.0).scalarPlus(1.0);
        let sh = h.step(new vec4(0,0,0,0)).times(-1);

        let a0 = new vec4(b0.x, b0.z, b0.y, b0.w).plus(new vec4(s0.x, s0.z, s0.y, s0.w).product(new vec4(sh.x, sh.x, sh.y, sh.y)));
        let a1 = new vec4(b1.x, b1.z, b1.y, b1.w).plus(new vec4(s1.x, s1.z, s1.y, s1.w).product(new vec4(sh.z, sh.z, sh.w, sh.w)));

        let p0 = new vec3(a0.x, a0.y, h.x);
        let p1 = new vec3(a0.z, a0.w, h.y);
        let p2 = new vec3(a1.x, a1.y, h.z);
        let p3 = new vec3(a1.z, a1.w, h.w);

    // Normalise gradients
        let norm = _taylorInvSqrt(new vec4(p0.dot(p0), p1.dot(p1), p2.dot(p2), p3.dot(p3)));
        p0 = p0.times(norm.x);
        p1 = p1.times(norm.y);
        p2 = p2.times(norm.z);
        p3 = p3.times(norm.w);

    // Mix final noise value
        let m = new vec4(0.6, 0.6, 0.6, 0.6).minus(new vec4(x0.dot(x0), x1.dot(x1), x2.dot(x2), x3.dot(x3))).max(new vec4(0, 0, 0, 0));
        m = m.product(m);
        return 42.0 *
            m.product(m).dot(new vec4(p0.dot(x0), p1.dot(x1), p2.dot(x2), p3.dot(x3)));
    }
}

class Noise {
    constructor(seed) {
        this.seed = seed;
        this.s = new Simplex();
    }

    simpleNoise(pos, numLayers, scale, persistence, lacunarity, multiplier) {
        let noiseSum = 0;
        let amplitude = 1;
        let frequency = scale;
        for (let i = 0; i < numLayers; i++) {
            noiseSum += this.s.noise(new vec3(pos.x + this.seed * frequency, pos.y + this.seed * frequency, pos.z + this.seed * frequency)) * amplitude;
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