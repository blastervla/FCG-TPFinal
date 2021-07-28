
// Estructuras globales e inicializaciones
var boxDrawer;          // clase para contener el comportamiento de la caja
var meshDrawer;         // clase para contener el comportamiento de la malla
var canvas, gl;         // canvas y contexto WebGL
var perspectiveMatrix;	// matriz de perspectiva

var rotX=0, rotY=0, transZ=3, autorot=0;

// Funcion de inicialización, se llama al cargar la página
function InitWebGL()
{
	// Inicializamos el canvas WebGL
	canvas = document.getElementById("canvas");
	canvas.oncontextmenu = function() {return false;};
	gl = canvas.getContext("webgl", {antialias: false, depth: true});	
	if (!gl) 
	{
		alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
		return;
	}
	
	// Inicializar color clear
	gl.clearColor(0,0,0,0);
	gl.enable(gl.DEPTH_TEST); // habilitar test de profundidad 
	
	// Inicializar los shaders y buffers para renderizar	
	boxDrawer  = new BoxDrawer();
	meshDrawer = new MeshDrawer();
	
	// Setear el tamaño del viewport
	UpdateCanvasSize();
}

// Funcion para actualizar el tamaño de la ventana cada vez que se hace resize
function UpdateCanvasSize()
{
	// 1. Calculamos el nuevo tamaño del viewport
	canvas.style.width  = "100%";
	canvas.style.height = "100%";

	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width  = pixelRatio * canvas.clientWidth;
	canvas.height = pixelRatio * canvas.clientHeight;

	const width  = (canvas.width  / pixelRatio);
	const height = (canvas.height / pixelRatio);

	canvas.style.width  = width  + 'px';
	canvas.style.height = height + 'px';
	
	// 2. Lo seteamos en el contexto WebGL
	gl.viewport( 0, 0, canvas.width, canvas.height );

	// 3. Cambian las matrices de proyección, hay que actualizarlas
	UpdateProjectionMatrix();
}

// Calcula la matriz de perspectiva (column-major)
function ProjectionMatrix( c, z, fov_angle=60 )
{
	var r = c.width / c.height;
	var n = (z - 1.74);
	const min_n = 0.001;
	if ( n < min_n ) n = min_n;
	var f = (z + 1.74);;
	var fov = 3.145 * fov_angle / 180;
	var s = 1 / Math.tan( fov/2 );
	return [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n+f)/(f-n), 1,
		0, 0, -2*n*f/(f-n), 0
	];
}

// Devuelve la matriz de perspectiva (column-major)
function UpdateProjectionMatrix()
{
	perspectiveMatrix = ProjectionMatrix( canvas, transZ );
}

// Funcion que reenderiza la escena. 
function DrawScene()
{
	// 1. Obtenemos las matrices de transformación 
	var mv  = GetModelViewMatrix( 0, 0, transZ, rotX, autorot+rotY );
	var mvp = MatrixMult( perspectiveMatrix, mv );

	// 2. Limpiamos la escena
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	
	// 3. Le pedimos a cada objeto que se dibuje a si mismo
	var nrmTrans = [ mv[0],mv[1],mv[2], mv[4],mv[5],mv[6], mv[8],mv[9],mv[10] ];
	meshDrawer.draw( mvp, mv, nrmTrans );
	if ( showBox.checked ) {
		boxDrawer.draw( mvp );
	}
}

// Función que compila los shaders que se le pasan por parámetro (vertex & fragment shaders)
// Recibe los strings de cada shader y retorna un programa
function InitShaderProgram( vsSource, fsSource, wgl=gl )
{
	// Función que compila cada shader individualmente
	const vs = CompileShader( wgl.VERTEX_SHADER,   vsSource, wgl );
	const fs = CompileShader( wgl.FRAGMENT_SHADER, fsSource, wgl );

	// Crea y linkea el programa 
	const prog = wgl.createProgram();
	wgl.attachShader(prog, vs);
	wgl.attachShader(prog, fs);
	wgl.linkProgram(prog);

	if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) 
	{
		alert('No se pudo inicializar el programa: ' + wgl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

// Función para compilar shaders, recibe el tipo (gl.VERTEX_SHADER o gl.FRAGMENT_SHADER)
// y el código en forma de string. Es llamada por InitShaderProgram()
function CompileShader( type, source, wgl=gl )
{
	// Creamos el shader
	const shader = wgl.createShader(type);

	// Lo compilamos
	wgl.shaderSource(shader, source);
	wgl.compileShader(shader);

	// Verificamos si la compilación fue exitosa
	if (!wgl.getShaderParameter( shader, wgl.COMPILE_STATUS) ) 
	{
		alert('Ocurrió un error durante la compilación del shader:' + wgl.getShaderInfoLog(shader));
		wgl.deleteShader(shader);
		return null;
	}

	return shader;
}

// Multiplica 2 matrices y devuelve A*B.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
function MatrixMult( A, B )
{
	var C = [];
	for ( var i=0; i<4; ++i ) 
	{
		for ( var j=0; j<4; ++j ) 
		{
			var v = 0;
			for ( var k=0; k<4; ++k ) 
			{
				v += A[j+4*k] * B[k+4*i];
			}

			C.push(v);
		}
	}
	return C;
}

// ======== Funciones para el control de la interfaz ========

var showBox = {checked: false};  // boleano para determinar si se debe o no mostrar la caja

// Al cargar la página
window.onload = function() 
{
	// showBox = document.getElementById('show-box');
	document.getElementById('world-seed').value = seed;
	InitWebGL();
	
	// Componente para la luz
	lightView = new LightView();

	// Evento de zoom (ruedita)
	canvas.zoom = function( s ) 
	{
		transZ *= s/canvas.height + 1;
		UpdateProjectionMatrix();
		DrawScene();
	}
	canvas.onwheel = function() { canvas.zoom(0.3*event.deltaY); }

	// Evento de click 
	canvas.onmousedown = function() 
	{
		var cx = event.clientX;
		var cy = event.clientY;
		if ( event.ctrlKey ) 
		{
			canvas.onmousemove = function() 
			{
				canvas.zoom(5*(event.clientY - cy));
				cy = event.clientY;
			}
		}
		else 
		{   
			// Si se mueve el mouse, actualizo las matrices de rotación
			canvas.onmousemove = function() 
			{
				rotY += (cx - event.clientX)/canvas.width*5;
				rotX += (cy - event.clientY)/canvas.height*5;
				cx = event.clientX;
				cy = event.clientY;
				UpdateProjectionMatrix();
				DrawScene();
			}
		}
	}

	// Evento soltar el mouse
	canvas.onmouseup = canvas.onmouseleave = function() 
	{
		canvas.onmousemove = null;
	}
	
	SetShininess( document.getElementById('shininess-exp') );
	
	ChangeSeaLine(87);

	AutoRotate({checked: true});

	// Dibujo la escena
	DrawScene();

	ReloadWorld();

	LoadAtmosphere();
};

// Evento resize
function WindowResize()
{
	UpdateCanvasSize();
	DrawScene();
}

var size = 20;
function ChangeWorldSize(newSize) {
	size = parseInt(newSize);
	document.getElementById('world-size-value').innerText = newSize;
	ReloadWorld();
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

var seed = parseInt(getRandomArbitrary(1, 1000000000));
function ChangeWorldSeed(newSeed) {
	seed = newSeed;
	ReloadWorld();
}

function ChangeContinentNumLayers(numLayers) {
	continentOpts.numLayers = parseInt(numLayers);
	document.getElementById('world-numLayers-value').innerText = numLayers;
	ReloadWorld();
}

function ChangeContinentScale(scale) {
	continentOpts.scale = parseInt(scale);
	document.getElementById('world-scale-value').innerText = scale;
	ReloadWorld();
}

function ChangeContinentPersistence(persistence) {
	continentOpts.persistence = parseFloat(persistence);
	document.getElementById('world-persistence-value').innerText = persistence;
	ReloadWorld();
}

function ChangeContinentLacunarity(lacunarity) {
	continentOpts.lacunarity = parseFloat(lacunarity);
	document.getElementById('world-lacunarity-value').innerText = lacunarity;
	ReloadWorld();
}

function ChangeContinentMultiplier(multiplier) {
	continentOpts.multiplier = parseFloat(multiplier);
	document.getElementById('world-multiplier-value').innerText = multiplier;
	ReloadWorld();
}

function ChangeOceanDepth(depth) {
	oceanOpts.depth = parseFloat(depth);
	document.getElementById('ocean-depth-value').innerText = depth;
	ReloadWorld();
}

function ChangeOceanDepthMultiplier(depthMultiplier) {
	oceanOpts.depthMultiplier = parseFloat(depthMultiplier);
	document.getElementById('ocean-depthMultiplier-value').innerText = depthMultiplier;
	ReloadWorld();
}

function ChangeOceanSmoothing(smoothing) {
	oceanOpts.smoothing = parseFloat(smoothing);
	document.getElementById('ocean-smoothing-value').innerText = smoothing;
	ReloadWorld();
}

function ChangeMountainNumLayers(numLayers) {
	mountainOpts.numLayers = parseInt(numLayers);
	document.getElementById('mountain-numLayers-value').innerText = numLayers;
	ReloadWorld();
}

function ChangeMountainScale(scale) {
	mountainOpts.scale = parseFloat(scale);
	document.getElementById('mountain-scale-value').innerText = scale;
	ReloadWorld();
}

function ChangeMountainBlend(blend) {
	mountainOpts.blend = parseFloat(blend);
	document.getElementById('mountain-blend-value').innerText = blend;
	ReloadWorld();
}

function ChangeMountainPersistence(persistence) {
	mountainOpts.persistence = parseFloat(persistence);
	document.getElementById('mountain-persistence-value').innerText = persistence;
	ReloadWorld();
}

function ChangeMountainLacunarity(lacunarity) {
	mountainOpts.lacunarity = parseFloat(lacunarity);
	document.getElementById('mountain-lacunarity-value').innerText = lacunarity;
	ReloadWorld();
}

function ChangeMountainMultiplier(multiplier) {
	mountainOpts.multiplier = parseFloat(multiplier);
	document.getElementById('mountain-multiplier-value').innerText = multiplier;
	ReloadWorld();
}

function ChangeMountainPower(power) {
	mountainOpts.power = parseFloat(power);
	document.getElementById('mountain-power-value').innerText = power;
	ReloadWorld();
}

function ChangeMountainGain(gain) {
	mountainOpts.gain = parseFloat(gain);
	document.getElementById('mountain-gain-value').innerText = gain;
	ReloadWorld();
}

function ChangeMountainOffset(offset) {
	mountainOpts.offset = parseFloat(offset);
	document.getElementById('mountain-offset-value').innerText = offset;
	ReloadWorld();
}

function ChangeMountainVerticalShift(verticalShift) {
	mountainOpts.verticalShift = parseFloat(verticalShift);
	document.getElementById('mountain-verticalShift-value').innerText = verticalShift;
	ReloadWorld();
}

function ChangeSeaLine(seaLine) {
	seaLine = parseFloat(seaLine);
	document.getElementById('sea-line-value').innerText = seaLine;
	meshDrawer.setSeaLine(seaLine / 100);
	DrawScene();
}

var continentOpts = {
	numLayers: 3,
	scale: 100,
	persistence: 0.25,
	lacunarity: 0.25,
	multiplier: 1,
};

var oceanOpts = {
	depth: 5.5,
	depthMultiplier: 16.5,
	smoothing: 2
};

var mountainOpts = {
	numLayers: 3,
	scale: 1,
	blend: 1,
	persistence: 0.25,
	lacunarity: 0.25,
	multiplier: 1,
	power: 1,
	gain: 1,
	offset: 1,
	verticalShift: -1,
};
function ReloadWorld() {
	LoadObjFromString(new SphereCreator().createSphere(size, seed, continentOpts, oceanOpts, mountainOpts), false);
	LoadObjFromString(new SphereCreator().createSphere(size, seed * seed / 1000, Object.assign({}, continentOpts, {multiplier: 0.2}), oceanOpts, mountainOpts), true);
}

// Control de la calesita de rotación
var timer;
var ROTATION_SPEED = 3;
var lightRotX = 35;
var lightRotY = Math.PI;
function AutoRotate( param )
{
	// Si hay que girar...
	if ( param.checked ) 
	{
		// Vamos rotando una cantiad constante cada 30 ms
		timer = setInterval( function() 
		{
			autorot += 0.0005 * ROTATION_SPEED;
			autorot %= 2*Math.PI;

			// Reenderizamos
			DrawScene();
		}, 30
		);
	} 
	else 
	{
		clearInterval( timer );
	}
}

var lightTimer;
function AutoRotateLight( param )
{
	// Si hay que girar...
	if ( param.checked ) 
	{
		// Vamos rotando una cantiad constante cada 30 ms
		lightTimer = setInterval(function() {
			lightRotY += 0.0005 * ROTATION_SPEED * 10;
			lightRotY %= 2*Math.PI;
			var cy = Math.cos(lightRotY);
			var sy = Math.sin(lightRotY);
			var cx = Math.cos(lightRotX);
			var sx = Math.sin(lightRotX);
			meshDrawer.setLightDir( -sy, cy*sx, -cy*cx );
			// Reenderizamos
			DrawScene();
		}, 30);
	} 
	else 
	{
		lightRotY = Math.PI;
		var cy = Math.cos(lightRotY);
		var sy = Math.sin(lightRotY);
		var cx = Math.cos(lightRotX);
		var sx = Math.sin(lightRotX);
		meshDrawer.setLightDir( -sy, cy*sx, -cy*cx );
		// Reenderizamos
		DrawScene();

		clearInterval( lightTimer );
	}
}

// Control de textura visible
function ShowTexture( param )
{
	meshDrawer.showTexture( param.checked );
	DrawScene();
}

// Control de intercambiar y-z
function SwapYZ( param )
{
	meshDrawer.swapYZ( param.checked );
	DrawScene();
}

// Cargar archivo obj
function LoadObj( param )
{
	if ( param.files && param.files[0] ) 
	{
		var reader = new FileReader();
		reader.onload = function(e) 
		{
			// LoadObjFromString(e.target.result);
			ReloadWorld();
		}
		reader.readAsText( param.files[0] );
	}
}

function LoadObjFromString(obj, isAtmosphere) {
	var mesh = new ObjMesh;
	mesh.parse( obj );
	var box = mesh.getBoundingBox();
	var shift = [
		-(box.min[0]+box.max[0])/2,
		-(box.min[1]+box.max[1])/2,
		-(box.min[2]+box.max[2])/2
	];
	var size = [
		(box.max[0]-box.min[0])/2,
		(box.max[1]-box.min[1])/2,
		(box.max[2]-box.min[2])/2
	];
	var maxSize = Math.max( size[0], size[1], size[2] );
	var scale = 1/maxSize;
	mesh.shiftAndScale( shift, scale );
	var buffers = mesh.getVertexBuffers();
	if (!isAtmosphere) {
		meshDrawer.setMesh( buffers.positionBuffer, buffers.texCoordBuffer, buffers.normalBuffer );
	} else {
		meshDrawer.setAtmosphereMesh( buffers.positionBuffer, buffers.texCoordBuffer, buffers.normalBuffer );
	}
	DrawScene();
}

// Cargar textura
function LoadTexture( param )
{
	if ( param.files && param.files[0] ) 
	{
		var reader = new FileReader();
		reader.onload = function(e) 
		{
			var img = document.getElementById('texture-img');
			img.onload = function() 
			{
				meshDrawer.setTexture( img );
				DrawScene();
			}
			img.src = e.target.result;
		};
		reader.readAsDataURL( param.files[0] );
	}
}

function LoadAtmosphere() {
	var img = document.getElementById('texture-img');
	img.onload = function() 
	{
		meshDrawer.setTexture( img );
		DrawScene();
	}
	img.src = "https://blastervla.github.io/FCG-TPFinal/textures/clouds.jpg";
}


// Setear Intensidad
function SetShininess( param )
{
	var exp = param.value;
	var s = Math.pow(10,exp/25);
	document.getElementById('shininess-value').innerText = s.toFixed( s < 10 ? 2 : 0 );
	meshDrawer.setShininess(s);
	DrawScene();
}

function SetAtmosphere( param )
{
	meshDrawer.setAtmosphere(param.checked)
	DrawScene();
}

