class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    plus(other) {
        return new Vertex(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z,
        );
    }

    minus(other) {
        return new Vertex(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        );
    }

    times(scalar) {
        return new Vertex(
            this.x * scalar,
            this.y * scalar,
            this.z * scalar,
        );
    }

    subdividedSegmentWith(other, n) {
        let newVertices = [this];
        for (let i = 1; i < n; i++) {
            newVertices.push(new Vertex(
                this.x + i / n * (other.x - this.x),
                this.y + i / n * (other.y - this.y),
                this.z + i / n * (other.z - this.z),
            ));
        }
        newVertices.push(other);
        return newVertices;
    }

    distance(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let dz = other.z - this.z;

        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalizeWithRespectTo(other, length) {
        // Get the distance between this and other
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let dz = other.z - this.z;

        // Right now, sqrt(dx^2 + dy^2) = distance(a,b).
        // We want to modify them so that sqrt(dx^2 + dy^2) = the given length.
        dx = dx * length / this.distance(other);
        dy = dy * length / this.distance(other);
        dz = dz * length / this.distance(other);

        return new Vertex(this.x + dx, this.y + dy, this.z + dz);
    }

    normalized() {
        let norm = this.norm();
        return new Vertex(this.x / norm, this.y / norm, this.z / norm);
    }

    cross(other) {
        return new Vertex(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x,
        )
    }

    toString() {
        return `${this.x} ${this.y} ${this.z}`;
    }
}

class Triangle {
    constructor(A, B, C) {
        this.A = A;
        this.B = B;
        this.C = C;
    }

    calculateNormal(creator) {
        let AB = creator.getVertex(this.B).minus(creator.getVertex(this.A));
        let AC = creator.getVertex(this.C).minus(creator.getVertex(this.A));
        return AB.cross(AC);
    }

    containsVertex(v) {
        return this.A === v || this.B === v || this.C === v;
    }

    toString() {
        return `${this.A}/1/${this.A} ${this.B}/1/${this.B} ${this.C}/1/${this.C}`;
    }
}

class ShapeCreator {
    constructor() {
        this.vertices = [];
        this.idForVertex = {};
        this.triangles = [];
    }

    addVertex(x, y, z) {
        return this.addRawVertex(new Vertex(x, y, z))
    }

    addRawVertex(v) {
        this.vertices.push(v);
        this.idForVertex[v] = this.vertices.length;
        return this.vertices.length;
    }

    getVertex(vid) {
        return this.vertices[vid - 1];
    }

    addTriangle(A, B, C) {
        this.triangles.push(new Triangle(A, B, C));
        return this.triangles.length;
    }

    getTriangle(tid) {
        return this.triangles[tid - 1];
    }

    partitionTriangle(tid, degree) {
        let f = this.triangles[tid - 1];
        // Para los v??rtices sobre los edges:
        //     Tomar el segmento entre 2 v??rtices y subdividirlo 'degree' veces
        // Para poder adem??s generar los internos:
        //     Tomar 2 v??rtices y sus segmentos con el 3ro restante.
        //     Al subdividir cada segmento (en direcci??n al 3er v??rtice), hay que "conectar" cada uno de los nuevos v??rtices
        //     con su contraparte del otro segmento (es decir, llamamos al segmento que los conecta X).
        //     A continuaci??n, subdividimos X degree - 1 veces. Y as??

        // Para las caras:
        //     Tomar 1 v??rtice pivote y sus segmentos salientes hacia los otros 2 restantes. Adem??s tomar uno de los otros
        //     dos v??rtices y su segmento hacia el ??ltimo v??rtice (ie: el que no es pivote). Sea este segmento X.
        //     Desde el v??rtice pivote, tomar el primer v??rtice nuevo de cada segmento. Tomar el nuevo segmento Y que une al
        //     primer v??rtice nuevo del segmento NO adyacente a X.
        //     Conectar estos dos, y mover el primer v??rtice nuevo sobre Y. Conectar estos dos, y mover el otro v??rtice sobre
        //     El segmento que conecta



        //     Sean A, B y C los 3 v??rtices. Elegir A como pivote, y tomar los segmentos AC y AB.
        //     Posicionarse sobre AC_1 y AB_1, los primeros v??rtices nuevos en cada segmento.
        //     Tomar adem??s el segmento BC y posicionarse sobre BC_1. Tomar ahora el segmento X que conecta AC_1 con BC_1.
        //     Unir AC_1 con AB_1, y avanzar AC_1 = X_0 a X_1. Unir X_1 con AB_1 y avanzar AB_1 a AB_2. Unirlos y...
        //     Continuar hasta que se toque AB_n (ie: se llegue al final del segmento inferior).

        //     Hecho esto, tomar AC_2 y X_1, y tomar Y el segmento que une a AC_2 con BC_2. Repetir el proceso aqu??
        //     Continuar haciendo esto hasta que, finalmente, lleguemos al ??ltimo nivel y no podamos subir m??s.

        let A = this.getVertex(f.A);
        let B = this.getVertex(f.B);
        let C = this.getVertex(f.C);

        let AC = A.subdividedSegmentWith(C, degree);
        let AB = A.subdividedSegmentWith(B, degree);
        let BC = B.subdividedSegmentWith(C, degree);

        for (let i = 1; i < AB.length - 1; i++) { // We exclude first and last since they are A and B
            if (!this.idForVertex[AB[i]]) {
                this.addRawVertex(AB[i]);
            }
        }

        for (let level = 0; level < degree; level++) {
            let currentBottomIndex = 1;
            let currentTopIndex = 0;
            let currentBottomSegment = AC[level].subdividedSegmentWith(BC[level], degree - level);
            let currentTopSegment;
            if (level + 1 !== degree) {
                currentTopSegment = AC[level + 1].subdividedSegmentWith(BC[level + 1], degree - (level + 1));
                if (!this.idForVertex[currentTopSegment[currentTopIndex]]) {
                    this.addRawVertex(currentTopSegment[currentTopIndex]);
                }
            } else {
                currentTopSegment = [AC[level + 1]];
            }

            while (currentTopIndex < currentTopSegment.length) {
                let v1 = this.idForVertex[currentBottomSegment[currentBottomIndex]];

                // We don't re-add top level since we already have it (it's a single vertex, C)
                // and we only add just after advancing the currentTopIndex
                if (currentBottomIndex === currentTopIndex && level + 1 !== degree
                    && !this.idForVertex[currentTopSegment[currentTopIndex]]) {
                    this.addRawVertex(currentTopSegment[currentTopIndex]);
                }
                let v2 = this.idForVertex[currentTopSegment[currentTopIndex]];
                let v3;
                if (currentBottomIndex === currentTopIndex) {
                    v3 = this.idForVertex[currentTopSegment[currentTopIndex - 1]];
                    currentBottomIndex++;
                } else {
                    v3 = this.idForVertex[currentBottomSegment[currentBottomIndex - 1]];
                    currentTopIndex++;
                }
                this.addTriangle(v1, v2, v3);
            }
        }
        this.triangles[tid - 1] = null;
    }

    spherizeAlong(center, radius, noiseSeed, continentOpts, oceanOpts, mountainOpts) {

        let noiseMachine = new Noise(noiseSeed);
        for (let i = 0; i < this.vertices.length; i++) {
            if (!!noiseSeed) {
                let continent = noiseMachine.simpleNoise(
                    this.vertices[i], continentOpts.numLayers, continentOpts.scale / 1000,
                    continentOpts.persistence, continentOpts.lacunarity, continentOpts.multiplier
                );

                let ocean = -oceanOpts.depth + continent * 0.15;
                continent = noiseMachine.smoothMax(continent, ocean, oceanOpts.smoothing);
                continent *= continent < 0 ? 1 + oceanOpts.depthMultiplier : 1;
                continent *= -1;

                // let mountainMask = noiseMachine.blend(0, mountainOpts.blend, noiseMachine.simpleNoise(
                //     this.vertices[i], mountainOpts.numLayers, mountainOpts.scale, 
                //     mountainOpts.persistence, mountainOpts.lacunarity, mountainOpts.multiplier
                // ));
                // let mountains = noiseMachine.smoothedRidgidNoise(
                //     this.vertices[i], mountainOpts.offset, mountainOpts.numLayers, 
                //     mountainOpts.persistence, mountainOpts.lacunarity, mountainOpts.scale, 
                //     mountainOpts.multiplier, mountainOpts.power, mountainOpts.gain, mountainOpts.verticalShift
                // ) * mountainMask;

                let finalHeight = radius + (continent /*+ mountains*/) * radius * 0.01;

                this.vertices[i] = center.normalizeWithRespectTo(this.vertices[i], finalHeight);
            } else {
                this.vertices[i] = center.normalizeWithRespectTo(this.vertices[i], radius);
            }
        }
    }
}

class SphereCreator {
    constructor() { }

    createSphere(size, seed, continentOpts, oceanOpts, mountainOpts) {
        let creator = new ShapeCreator();

        // We create a unitarian octahedron
        let vids = [
            creator.addVertex(size, 0, 0),
            creator.addVertex(0, size, 0),
            creator.addVertex(0, 0, size),
            creator.addVertex(-size, 0, 0),
            creator.addVertex(0, -size, 0),
            creator.addVertex(0, 0, -size),
        ];

        let tids = [
            creator.addTriangle(vids[0], vids[1], vids[2]),
            creator.addTriangle(vids[1], vids[3], vids[2]),
            creator.addTriangle(vids[3], vids[4], vids[2]),
            creator.addTriangle(vids[4], vids[0], vids[2]),
            creator.addTriangle(vids[0], vids[4], vids[5]),
            creator.addTriangle(vids[4], vids[3], vids[5]),
            creator.addTriangle(vids[3], vids[1], vids[5]),
            creator.addTriangle(vids[1], vids[0], vids[5]),
        ];

        for (let tid of tids) {
            creator.partitionTriangle(tid, size + 1);
        }

        creator.spherizeAlong(
            new Vertex(0, 0, 0), size, seed,
            continentOpts, oceanOpts, mountainOpts);

        let normals = []

        for (let vid = 1; vid <= creator.vertices.length; vid++) {
            let tNormals = []
            for (const triangle of creator.triangles) {
                if (!triangle || !triangle.containsVertex(vid)) {
                    continue;
                }

                tNormals.push(triangle.calculateNormal(creator));
            }

            let vNormal = new Vertex(0, 0, 0);
            for (const normal of tNormals) {
                vNormal = vNormal.plus(normal);
            }
            normals.push(vNormal.normalized());
        }

        let obj = "vt 0 0\n"
        for (let v of creator.vertices) {
            obj += `v ${v}\n`
        }
        obj += "\n"

        for (const n of normals) {
            obj += `vn ${n}\n`
        }

        obj += "\n"

        for (let t of creator.triangles.filter(t => !!t)) {
            obj += `f ${t}\n`
        }

        return obj
    }
}