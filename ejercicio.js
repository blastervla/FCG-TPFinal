
// <============================================ EJERCICIOS ============================================>
// a) Implementar la función:
//
//      GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
//
//    Si la implementación es correcta, podrán hacer rotar la caja correctamente (como en el video). Notar 
//    que esta función no es exactamente la misma que implementaron en el TP4, ya que no recibe por parámetro
//    la matriz de proyección. Es decir, deberá retornar solo la transformación antes de la proyección model-view (MV)
//    Es necesario completar esta implementación para que funcione el control de la luz en la interfaz. 
//    IMPORTANTE: No es recomendable avanzar con los ejercicios b) y c) si este no funciona correctamente. 
//
// b) Implementar los métodos:
//
//      setMesh( vertPos, texCoords, normals )
//      swapYZ( swap )
//      draw( matrixMVP, matrixMV, matrixNormal )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado, asi como también intercambiar 
//    sus coordenadas yz. Notar que es necesario pasar las normales como atributo al VertexShader. 
//    La función draw recibe ahora 3 matrices en column-major: 
//
//       * model-view-projection (MVP de 4x4)
//       * model-view (MV de 4x4)
//       * normal transformation (MV_3x3)
//
//    Estas últimas dos matrices adicionales deben ser utilizadas para transformar las posiciones y las normales del 
//    espacio objeto al esapcio cámara. 
//
// c) Implementar los métodos:
//
//      setTexture( img )
//      showTexture( show )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado y su textura.
//    Notar que los shaders deberán ser modificados entre el ejercicio b) y el c) para incorporar las texturas.
//  
// d) Implementar los métodos:
//
//      setLightDir(x,y,z)
//      setShininess(alpha)
//    
//    Estas funciones se llaman cada vez que se modifican los parámetros del modelo de iluminación en la 
//    interface. No es necesario transformar la dirección de la luz (x,y,z), ya viene en espacio cámara.
//
// Otras aclaraciones: 
//
//      * Utilizaremos una sola fuente de luz direccional en toda la escena
//      * La intensidad I para el modelo de iluminación debe ser seteada como blanca (1.0,1.0,1.0,1.0) en RGB
//      * Es opcional incorporar la componente ambiental (Ka) del modelo de iluminación
//      * Los coeficientes Kd y Ks correspondientes a las componentes difusa y especular del modelo 
//        deben ser seteados con el color blanco. En caso de que se active el uso de texturas, la 
//        componente difusa (Kd) será reemplazada por el valor de textura. 
//        
// <=====================================================================================================>

// Esta función recibe la matriz de proyección (ya calculada), una 
// traslación y dos ángulos de rotación (en radianes). Cada una de 
// las rotaciones se aplican sobre el eje x e y, respectivamente. 
// La función debe retornar la combinación de las transformaciones 
// 3D (rotación, traslación y proyección) en una matriz de 4x4, 
// representada por un arreglo en formato column-major. 

function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
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

	var mv = MatrixMult(trans, rot);
	return mv;
}

class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		// inicializaciones
		this.show = true;

		let version = "#version 300 es\n";
		let libs = "\n" + loadFile("./shaders/commonNoise.glsl") 
				 + "\n" + loadFile("./shaders/simplexNoise.glsl");
		let meshVS = version + libs + loadFile("./shaders/vertexShader.glsl");
		
		let meshFS = version + loadFile("./shaders/fragmentShader.glsl");
		let atmosphereVS = loadFile("./shaders/atmosphere/vertexShader.glsl");
		let atmosphereFS = loadFile("./shaders/atmosphere/fragmentShader.glsl");

		// 1. Compilamos el programa de shaders
		this.prog = InitShaderProgram( meshVS, meshFS );
		this.atmosphereProg = InitShaderProgram( atmosphereVS, atmosphereFS );
		
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
		this.mn = gl.getUniformLocation( this.prog, 'mn' );
		this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininess = gl.getUniformLocation(this.prog, 'shininess');
		this.seaLine = gl.getUniformLocation(this.prog, 'seaLine');
		this.seed = gl.getUniformLocation(this.prog, 'seed');
		this.layerNumber = gl.getUniformLocation(this.prog, 'layerNumber');
		this.scale = gl.getUniformLocation(this.prog, 'scale');
		this.persistence = gl.getUniformLocation(this.prog, 'persistence');
		this.lacunarity = gl.getUniformLocation(this.prog, 'lacunarity');
		this.multiplier = gl.getUniformLocation(this.prog, 'multiplier');
		this.depth = gl.getUniformLocation(this.prog, 'depth');
		this.depthMultiplier = gl.getUniformLocation(this.prog, 'depthMultiplier');
		this.oceanSmoothing = gl.getUniformLocation(this.prog, 'oceanSmoothing');

		this.atmMvp = gl.getUniformLocation( this.atmosphereProg, 'mvp' );
		this.atmMv = gl.getUniformLocation( this.atmosphereProg, 'mv' );
		this.atmMn = gl.getUniformLocation( this.atmosphereProg, 'mn' );
		this.atmLightDir = gl.getUniformLocation(this.atmosphereProg, 'lightDir');
		this.atmShininess = gl.getUniformLocation(this.atmosphereProg, 'shininess');
		this.atmPos = gl.getAttribLocation( this.atmosphereProg, 'pos' );
		this.atmNormals = gl.getAttribLocation( this.atmosphereProg, 'normal' );

		// 3. Obtenemos los IDs de los atributos de los vértices, texturas y normales en los shaders
		this.pos = gl.getAttribLocation( this.prog, 'pos' );
		// this.textureCoordinates = gl.getAttribLocation( this.prog, 'textureCoordinates' );
		this.normals = gl.getAttribLocation( this.prog, 'normal' );

		// Texture
		this.textureSampler = gl.getUniformLocation(this.prog, 'texGPU');
		this.atmTextureSampler = gl.getUniformLocation(this.atmosphereProg, 'texGPU');
		// this.useTexture = gl.getUniformLocation(this.prog, 'useTex');

		// Seleccionamos el shader
		gl.useProgram( this.prog );

		// Creamos el buffer para los vértices y normales
		this.positionBuffer = gl.createBuffer();
		this.normalsBuffer = gl.createBuffer();

		gl.useProgram( this.atmosphereProg );

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
	setMesh( vertPos, texCoords, normals )
	{
		this.numTriangles = vertPos.length / 3 / 3;

		gl.useProgram( this.prog );
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalsBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}

	setAtmosphereMesh( vertPos, texCoords, normals )
	{
		this.atmNumTriangles = vertPos.length / 3 / 3;

		gl.useProgram( this.atmosphereProg );
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer( gl.ARRAY_BUFFER, this.atmPositionBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales
		gl.bindBuffer( gl.ARRAY_BUFFER, this.atmNormalsBuffer );
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz model-view-projection (matrixMVP),
	// la matriz model-view (matrixMV) que es retornada por 
	// GetModelViewProjection y la matriz de transformación de las 
	// normales (matrixNormal) que es la inversa transpuesta de matrixMV
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// 1. Seleccionamos el shader
		gl.useProgram(this.atmosphereProg);
	
		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv(this.atmMv, false, matrixMV);
		gl.uniformMatrix4fv(this.atmMvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.atmMn, false, matrixNormal);
		
	    // 3. Habilitar atributos: vértices, normales, texturas
		// Vértices
		gl.bindBuffer( gl.ARRAY_BUFFER, this.atmPositionBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.atmPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.atmPos );

		// Normales
		gl.bindBuffer( gl.ARRAY_BUFFER, this.atmNormalsBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.atmNormals, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.atmNormals );
		
		// ...
		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.atmNumTriangles * 3);

		gl.enable(gl.DEPTH_TEST);
		
		// 1. Seleccionamos el shader
		gl.useProgram(this.prog);
	
		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.mn, false, matrixNormal);
		
	    // 3. Habilitar atributos: vértices, normales, texturas
		// Vértices
		gl.bindBuffer( gl.ARRAY_BUFFER, this.positionBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.pos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.pos );

		// Normales
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalsBuffer );
		
		// Habilitamos el atributo 
		gl.vertexAttribPointer( this.normals, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normals );

		// ...
		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3);

		gl.disable(gl.DEPTH_TEST);
	}
	
	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
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
	showTexture( show )
	{
		this.show = show;
		// Setear variables uniformes en el fragment shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTexture, show ? 1 : 0);
	}
	
	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir( x, y, z )
	{
		gl.useProgram(this.prog);
		gl.uniform3fv(this.lightDir, [x, y, z]);

		gl.useProgram(this.atmosphereProg);
		gl.uniform3fv(this.atmLightDir, [x, y, z]);
	}
		
	// Este método se llama al actualizar el brillo del material 
	setShininess( shininess )
	{
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);

		gl.useProgram(this.atmosphereProg);
		gl.uniform1f(this.atmShininess, shininess);
	}

	setSeaLine( seaLine )
	{
		gl.useProgram(this.prog);
		gl.uniform1f(this.seaLine, seaLine + 0.2);
	}

	setParams(size, seed, continentOpts, oceanOpts) {
		gl.useProgram(this.prog);

		gl.uniform1i(this.seed, parseInt(seed));
		gl.uniform1i(this.layerNumber, parseInt(continentOpts.numLayers));
		gl.uniform1f(this.scale, continentOpts.scale);
		gl.uniform1f(this.persistence, continentOpts.persistence);
		gl.uniform1f(this.lacunarity, continentOpts.lacunarity);
		gl.uniform1f(this.multiplier, continentOpts.multiplier);
		gl.uniform1f(this.depth, oceanOpts.depth);
		gl.uniform1f(this.depthMultiplier, oceanOpts.depthMultiplier);
		gl.uniform1f(this.oceanSmoothing, oceanOpts.smoothing);
	}
}