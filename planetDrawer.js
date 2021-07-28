// Esta función recibe la matriz de proyección (ya calculada), una 
// traslación y dos ángulos de rotación (en radianes). Cada una de 
// las rotaciones se aplican sobre el eje x e y, respectivamente. 
// La función debe retornar la combinación de las transformaciones 
// 3D (rotación, traslación y proyección) en una matriz de 4x4, 
// representada por un arreglo en formato column-major. 

function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
	let cos = Math.cos(rotationX);
	let sin = Math.sin(rotationX);
	var rotX = [
		1, 0, 0, 0,
		0, cos, sin, 0,
		0, -sin, cos, 0,
		0, 0, 0, 1
	]

	cos = Math.cos(rotationY);
	sin = Math.sin(rotationY);
	var rotY = [
		cos, 0, -sin, 0,
		0, 1, 0, 0,
		sin, 0, cos, 0,
		0, 0, 0, 1
	]

	var rot = MatrixMult(rotX, rotY);

	// Matriz de traslación
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var mv = MatrixMult(trans, rot);
	return mv;
}

class MeshDrawer {
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor() {
		// inicializaciones
		this.show = true;
		this.shouldShowAtmosphere = true;

		let meshVS = loadFile("./shaders/vertexShader.glsl");
		let meshFS = loadFile("./shaders/fragmentShader.glsl");

		let atmosphereVS = loadFile("./shaders/atmosphere/vertexShader.glsl");
		let atmosphereFS = loadFile("./shaders/atmosphere/fragmentShader.glsl");

		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.atmosphereProg = InitShaderProgram(atmosphereVS, atmosphereFS);

		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.mn = gl.getUniformLocation(this.prog, 'mn');
		this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininess = gl.getUniformLocation(this.prog, 'shininess');
		this.seaLine = gl.getUniformLocation(this.prog, 'seaLine');

		this.atmMvp = gl.getUniformLocation(this.atmosphereProg, 'mvp');
		this.atmMv = gl.getUniformLocation(this.atmosphereProg, 'mv');
		this.atmMn = gl.getUniformLocation(this.atmosphereProg, 'mn');
		this.atmLightDir = gl.getUniformLocation(this.atmosphereProg, 'lightDir');
		this.atmShininess = gl.getUniformLocation(this.atmosphereProg, 'shininess');
		this.atmPos = gl.getAttribLocation(this.atmosphereProg, 'pos');
		this.atmNormals = gl.getAttribLocation(this.atmosphereProg, 'normal');

		// 3. Obtenemos los IDs de los atributos de los vértices, texturas y normales en los shaders
		this.pos = gl.getAttribLocation(this.prog, 'pos');
		// this.textureCoordinates = gl.getAttribLocation( this.prog, 'textureCoordinates' );
		this.normals = gl.getAttribLocation(this.prog, 'normal');

		// Texture
		this.textureSampler = gl.getUniformLocation(this.prog, 'texGPU');
		this.atmTextureSampler = gl.getUniformLocation(this.atmosphereProg, 'texGPU');
		// this.useTexture = gl.getUniformLocation(this.prog, 'useTex');

		// Seleccionamos el shader
		gl.useProgram(this.prog);

		// Creamos el buffer para los vértices y normales
		this.positionBuffer = gl.createBuffer();
		this.normalsBuffer = gl.createBuffer();

		gl.useProgram(this.atmosphereProg);

		// Creamos el buffer para los vértices y normales
		this.atmPositionBuffer = gl.createBuffer();
		this.atmNormalsBuffer = gl.createBuffer();

		// Creamos el buffer para las coordenadas de textura y la textura
		this.atmTexture = gl.createTexture();
	}

	// Esta función se llama cada vez que el usuario carga un nuevo
	// archivo OBJ. En los argumentos de esta función llegan un areglo
	// con las posiciones 3D de los vértices, un arreglo 2D con las
	// coordenadas de textura y las normales correspondientes a cada 
	// vértice. Todos los items en estos arreglos son del tipo float. 
	// Los vértices y normales se componen de a tres elementos 
	// consecutivos en el arreglo vertPos [x0,y0,z0,x1,y1,z1,..] y 
	// normals [n0,n0,n0,n1,n1,n1,...]. De manera similar, las 
	// cooredenadas de textura se componen de a 2 elementos 
	// consecutivos y se  asocian a cada vértice en orden. 
	setMesh(vertPos, normals) {
		this.numTriangles = vertPos.length / 3 / 3;

		gl.useProgram(this.prog);
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}

	setAtmosphereMesh(vertPos, normals) {
		this.atmNumTriangles = vertPos.length / 3 / 3;

		gl.useProgram(this.atmosphereProg);
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.atmPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.atmNormalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}

	drawAtmosphere(matrixMVP, matrixMV, matrixNormal) {
		if (!this.shouldShowAtmosphere) { return; }
		gl.disable(gl.DEPTH_TEST);

		// 1. Seleccionamos el shader
		gl.useProgram(this.atmosphereProg);

		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv(this.atmMv, false, matrixMV);
		gl.uniformMatrix4fv(this.atmMvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.atmMn, false, matrixNormal);

		// 3. Habilitar atributos: vértices, normales, texturas
		// Vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.atmPositionBuffer);

		// Habilitamos el atributo 
		gl.vertexAttribPointer(this.atmPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.atmPos);

		// Normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.atmNormalsBuffer);

		// Habilitamos el atributo 
		gl.vertexAttribPointer(this.atmNormals, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.atmNormals);

		// ...
		// Dibujamos
		gl.drawArrays(gl.TRIANGLES, 0, this.atmNumTriangles * 3);
	}

	drawPlanet(matrixMVP, matrixMV, matrixNormal) {
		gl.enable(gl.DEPTH_TEST);

		// 1. Seleccionamos el shader
		gl.useProgram(this.prog);

		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.mn, false, matrixNormal);

		// 3. Habilitar atributos: vértices, normales, texturas
		// Vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

		// Habilitamos el atributo 
		gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.pos);

		// Normales
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);

		// Habilitamos el atributo 
		gl.vertexAttribPointer(this.normals, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normals);

		// ...
		// Dibujamos
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles * 3);
	}

	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture(img) {
		// Binding de la textura
		gl.useProgram(this.atmosphereProg);

		// Cargamos la textura
		gl.bindTexture(gl.TEXTURE_2D, this.atmTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		// Decimos que vamos a usar esa textura, en la unidad 0
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.atmTexture);

		// Y bindeamos el sampler a la unidad 0 también
		gl.uniform1i(this.atmTextureSampler, 0);
	}

	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture(show) {
		this.show = show;
		// Setear variables uniformes en el fragment shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTexture, show ? 1 : 0);
	}

	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir(x, y, z) {
		gl.useProgram(this.prog);
		gl.uniform3fv(this.lightDir, [x, y, z]);

		gl.useProgram(this.atmosphereProg);
		gl.uniform3fv(this.atmLightDir, [x, y, z]);
	}

	// Este método se llama al actualizar el brillo del material 
	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);

		gl.useProgram(this.atmosphereProg);
		gl.uniform1f(this.atmShininess, shininess);
	}

	setSeaLine(seaLine) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.seaLine, seaLine);
	}

	setAtmosphere(shouldShow) {
		this.shouldShowAtmosphere = shouldShow;
	}
}
