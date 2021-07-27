// <============================================ EJERCICIOS ============================================>
// a) Implementar la función:
//
//      GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
//
//    Si la implementación es correcta, podrán hacer rotar la caja correctamente (como en el video). IMPORTANTE: No
//    es recomendable avanzar con los ejercicios b) y c) si este no funciona correctamente. 
//
// b) Implementar los métodos:
//
//      setMesh( vertPos, texCoords )
//      swapYZ( swap )
//      draw( trans )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado, asi como también intercambiar 
//    sus coordenadas yz. Para reenderizar cada fragmento, en vez de un color fijo, pueden retornar: 
//
//      gl_FragColor = vec4(1,0,gl_FragCoord.z*gl_FragCoord.z,1);
//
//    que pintará cada fragmento con un color proporcional a la distancia entre la cámara y el fragmento (como en el video).
//    IMPORTANTE: No es recomendable avanzar con el ejercicio c) si este no funciona correctamente. 
//
// c) Implementar los métodos:
//
//      setTexture( img )
//      showTexture( show )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado y su textura.
//
// Notar que los shaders deberán ser modificados entre el ejercicio b) y el c) para incorporar las texturas.  
// <=====================================================================================================>



// Esta función recibe la matriz de proyección (ya calculada), una traslación y dos ángulos de rotación
// (en radianes). Cada una de las rotaciones se aplican sobre el eje x e y, respectivamente. La función
// debe retornar la combinación de las transformaciones 3D (rotación, traslación y proyección) en una matriz
// de 4x4, representada por un arreglo en formato column-major. El parámetro projectionMatrix también es 
// una matriz de 4x4 alamcenada como un arreglo en orden column-major. En el archivo project4.html ya está
// implementada la función MatrixMult, pueden reutilizarla. 

function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	let cos = Math.cos(rotationX);
	let sin = Math.sin(rotationX);
	var rotX = [
		1,    0,   0, 0,
		0,  cos, sin, 0,
		0, -sin, cos, 0,
		0,    0,   0, 1
	]

	cos = Math.cos(rotationY);
	sin = Math.sin(rotationY);
	var rotY = [
		cos, 0, -sin, 0,
		0,   1,    0, 0,
		sin, 0,  cos, 0,
		0,   0,    0, 1
	]

	var rot = MatrixMult(rotX, rotY);

	// Matriz de traslación
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var mvp = MatrixMult(projectionMatrix, MatrixMult(trans, rot));
	return mvp;
}

// [COMPLETAR] Completar la implementación de esta clase.
class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		// inicializaciones
		this.show = true;

		let meshVS = loadFile("./shaders/vertexShader.glsl");
		meshVS += "\n" + loadFile("./shaders/commonNoise.glsl");
		meshVS += "\n" + loadFile("./shaders/perlinNoise.glsl");
		let meshFS = loadFile("./shaders/fragmentShader.glsl");

		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram( meshVS, meshFS );
		
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.shouldSwapYZ = gl.getUniformLocation(this.prog, 'shouldSwapYZ');

		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.pos = gl.getAttribLocation( this.prog, 'pos' );
		this.normal = gl.getAttribLocation( this.prog, 'normal' );
		this.textureCoordinates = gl.getAttribLocation( this.prog, 'textureCoordinates' );

		// Texture
		this.textureSampler = gl.getUniformLocation(this.prog, 'texGPU');
		this.useTexture = gl.getUniformLocation(this.prog, 'useTex');

		// Seleccionamos el shader
		gl.useProgram( this.prog );

		// Creamos el buffer para los vértices
		this.positionBuffer = gl.createBuffer();

		this.normalBuffer = gl.createBuffer();

		// Creamos el buffer para las coordenadas de textura y la textura
		this.textureBuffer = gl.createBuffer();
		this.texture = gl.createTexture();
	}
	
	// Esta función se llama cada vez que el usuario carga un nuevo archivo OBJ.
	// En los argumentos de esta función llegan un areglo con las posiciones 3D de los vértices
	// y un arreglo 2D con las coordenadas de textura. Todos los items en estos arreglos son del tipo float. 
	// Los vértices se componen de a tres elementos consecutivos en el arreglo vertexPos [x0,y0,z0,x1,y1,z1,..,xn,yn,zn]
	// De manera similar, las cooredenadas de textura se componen de a 2 elementos consecutivos y se 
	// asocian a cada vértice en orden. 
	setMesh( vertPos, texCoords )
	{
		// [COMPLETAR] Actualizar el contenido del buffer de vértices
		this.numTriangles = vertPos.length / 3 / 3;
		this.vertPos = vertPos;

		gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertPos), gl.STATIC_DRAW);

		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}
	
	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Intercambiar Y-Z'
	// El argumento es un boleano que indica si el checkbox está tildado
	swapYZ(swap) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.shouldSwapYZ, swap ? 1 : 0);
	}
	
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz de transformación, la misma matriz que retorna GetModelViewProjection
	draw( trans )
	{	
		// 1. Seleccionamos el shader
		gl.useProgram(this.prog);
	
		// 2. Setear matriz de transformacion
		gl.uniformMatrix4fv(this.mvp, false, trans);
		
	    // 3.Binding de los buffers
		gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.pos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.pos );

		// Binding de buffer para texture coordinates
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.textureCoordinates, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.textureCoordinates );
		
		// ...
		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3);
	}
	
	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
		// Binding de la textura
		gl.useProgram(this.prog);
		
		// Cargamos la textura
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		// Decimos que vamos a usar esa textura, en la unidad 0
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Y bindeamos el sampler a la unidad 0 también
		gl.uniform1i(this.textureSampler, 0);
		gl.uniform1i(this.useTexture, this.show ? 1 : 0);
	}
	
	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture( show )
	{
		this.show = show;
		// Setear variables uniformes en el fragment shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTexture, show ? 1 : 0);
	}
}
