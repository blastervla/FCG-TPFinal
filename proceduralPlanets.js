
// Estructuras globales e inicializaciones
var meshDrawer;         // clase para contener el comportamiento de la malla
var canvas, gl;         // canvas y contexto WebGL
var perspectiveMatrix;	// matriz de perspectiva

var rotX = 0, rotY = 0, transZ = 3, autorot = 0, atmosphereAutorot = 0;

var INITIAL_ANIM_SPEED = 20, INITIAL_PERSISTENCE = 1, INITIAL_MULTIPLIER = 0.5;

// Funcion de inicialización, se llama al cargar la página
function InitWebGL() {
	// Inicializamos el canvas WebGL
	canvas = document.getElementById("canvas");
	canvas.oncontextmenu = function() {return false;};
	gl = canvas.getContext("webgl2", {antialias: false, depth: true});	
	if (!gl) 
	{
		alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
		return;
	}

	// Inicializar color clear
	gl.clearColor(0, 0, 0, 0);
	gl.enable(gl.DEPTH_TEST); // habilitar test de profundidad 

	// Inicializar los shaders y buffers para renderizar	
	meshDrawer = new MeshDrawer();

	// Setear el tamaño del viewport
	UpdateCanvasSize();
}

// Funcion para actualizar el tamaño de la ventana cada vez que se hace resize
function UpdateCanvasSize() {
	// 1. Calculamos el nuevo tamaño del viewport
	canvas.style.width = "100%";
	canvas.style.height = "100%";

	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width = pixelRatio * canvas.clientWidth;
	canvas.height = pixelRatio * canvas.clientHeight;

	const width = (canvas.width / pixelRatio);
	const height = (canvas.height / pixelRatio);

	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';

	// 2. Lo seteamos en el contexto WebGL
	gl.viewport(0, 0, canvas.width, canvas.height);

	// 3. Cambian las matrices de proyección, hay que actualizarlas
	UpdateProjectionMatrix();
}

// Calcula la matriz de perspectiva (column-major)
function ProjectionMatrix(c, z, fov_angle = 60) {
	var r = c.width / c.height;
	var n = (z - 1.74);
	const min_n = 0.001;
	if (n < min_n) n = min_n;
	var f = (z + 1.74);;
	var fov = 3.145 * fov_angle / 180;
	var s = 1 / Math.tan(fov / 2);
	return [
		s / r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n + f) / (f - n), 1,
		0, 0, -2 * n * f / (f - n), 0
	];
}

// Devuelve la matriz de perspectiva (column-major)
function UpdateProjectionMatrix() {
	perspectiveMatrix = ProjectionMatrix(canvas, transZ);
}

// Funcion que reenderiza la escena. 
function DrawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	meshDrawer.drawAtmosphere(...PrepareForDraw(atmosphereAutorot));
	meshDrawer.drawPlanet(...PrepareForDraw(autorot));
}

function PrepareForDraw(rotationMod) {
	var mv = GetModelViewMatrix(0, 0, transZ, rotX, rotationMod + rotY);
	var mvp = MatrixMult(perspectiveMatrix, mv);
	var nrmTrans = [mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]];

	return [mvp, mv, nrmTrans];
}

// Función que compila los shaders que se le pasan por parámetro (vertex & fragment shaders)
// Recibe los strings de cada shader y retorna un programa
function InitShaderProgram(vsSource, fsSource, wgl = gl) {
	// Función que compila cada shader individualmente
	const vs = CompileShader(wgl.VERTEX_SHADER, vsSource, wgl);
	const fs = CompileShader(wgl.FRAGMENT_SHADER, fsSource, wgl);

	// Crea y linkea el programa 
	const prog = wgl.createProgram();
	wgl.attachShader(prog, vs);
	wgl.attachShader(prog, fs);
	wgl.linkProgram(prog);

	if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) {
		alert('No se pudo inicializar el programa: ' + wgl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

// Función para compilar shaders, recibe el tipo (gl.VERTEX_SHADER o gl.FRAGMENT_SHADER)
// y el código en forma de string. Es llamada por InitShaderProgram()
function CompileShader(type, source, wgl = gl) {
	// Creamos el shader
	const shader = wgl.createShader(type);

	// Lo compilamos
	wgl.shaderSource(shader, source);
	wgl.compileShader(shader);

	// Verificamos si la compilación fue exitosa
	if (!wgl.getShaderParameter(shader, wgl.COMPILE_STATUS)) {
		alert('Ocurrió un error durante la compilación del shader:' + wgl.getShaderInfoLog(shader));
		wgl.deleteShader(shader);
		return null;
	}

	return shader;
}

// Multiplica 2 matrices y devuelve A*B.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
function MatrixMult(A, B) {
	var C = [];
	for (var i = 0; i < 4; ++i) {
		for (var j = 0; j < 4; ++j) {
			var v = 0;
			for (var k = 0; k < 4; ++k) {
				v += A[j + 4 * k] * B[k + 4 * i];
			}

			C.push(v);
		}
	}
	return C;
}

// ======== Funciones para el control de la interfaz ========

// Al cargar la página
var atmosphereTimer;
window.onload = function () {
	document.getElementById('world-seed').value = seed;
	InitWebGL();

	// Componente para la luz
	lightView = new LightView();

	// Evento de zoom (ruedita)
	canvas.zoom = function (s) {
		transZ *= s / canvas.height + 1;
		UpdateProjectionMatrix();
		DrawScene();
	}
	canvas.onwheel = function () { canvas.zoom(0.3 * event.deltaY); }

	// Evento de click 
	canvas.onmousedown = function () {
		var cx = event.clientX;
		var cy = event.clientY;
		if (event.ctrlKey) {
			canvas.onmousemove = function () {
				canvas.zoom(5 * (event.clientY - cy));
				cy = event.clientY;
			}
		}
		else {
			// Si se mueve el mouse, actualizo las matrices de rotación
			canvas.onmousemove = function () {
				rotY += (cx - event.clientX) / canvas.width * 5;
				rotX += (cy - event.clientY) / canvas.height * 5;
				cx = event.clientX;
				cy = event.clientY;
				UpdateProjectionMatrix();
				DrawScene();
			}
		}
	}

	// Evento soltar el mouse
	canvas.onmouseup = canvas.onmouseleave = function () {
		canvas.onmousemove = null;
	}
	
	SetShininess( document.getElementById('shininess-exp') );
	
	ChangeSeaLine(85);

	AutoRotate({ checked: true });

	// Dibujo la escena
	DrawScene();

	RecreateWorld();
	ReloadWorld();

	LoadAtmosphere();

	atmosphereTimer = setInterval(function () {
		atmosphereAutorot += 0.001 * ROTATION_SPEED;
		atmosphereAutorot %= 2 * Math.PI;

		// Reenderizamos
		DrawScene();
	}, 30);

	let initialAnimationTimer = setInterval(function () {
		continentOpts.multiplier = Math.min(continentOpts.multiplier + 0.001 * INITIAL_ANIM_SPEED, INITIAL_MULTIPLIER);
		continentOpts.persistence = Math.min(continentOpts.persistence + 0.001 * 2 * INITIAL_ANIM_SPEED, INITIAL_PERSISTENCE);

		meshDrawer.setParams(size, seed, continentOpts, oceanOpts);

		if (continentOpts.multiplier === INITIAL_MULTIPLIER && continentOpts.persistence === INITIAL_PERSISTENCE) {
			clearInterval(initialAnimationTimer);
		}
	}, 30);
};

// Evento resize
function WindowResize() {
	UpdateCanvasSize();
	DrawScene();
}

var size = 20;
function ChangeWorldSize(newSize) {
	size = parseInt(newSize);
	document.getElementById('world-size-value').innerText = newSize;
	RecreateWorld();
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
	continentOpts.lacunarity = parseFloat(lacunarity) * 0.6 / 100;
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

var oceanLine;
function ChangeSeaLine(seaLine) {
	oceanLine = parseFloat(seaLine);
	document.getElementById('sea-line-value').innerText = oceanLine;
	meshDrawer.setSeaLine(oceanLine / 100);
	ReloadWorld();
	DrawScene();
}

var continentOpts = {
	numLayers: 7,
	scale: 400,
	persistence: 0,
	lacunarity: 0.3,
	multiplier: 0,
};

var oceanOpts = {
	depth: 5.5,
	depthMultiplier: 16.5,
	smoothing: 2
};

/*var mountainOpts = {
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
};*/

function RecreateWorld() {
	LoadObjFromString(new SphereCreator().createSphere(size, null), false);
	LoadObjFromString(new SphereCreator().createSphere(size, null), true);
}

function ReloadWorld() {
	meshDrawer.setParams(size, seed, continentOpts, oceanOpts);
}

function UpdateGUI() {
	document.getElementById('world-size-value').innerText = newSize;
	document.getElementById('world-numLayers-value').innerText = numLayers;
	document.getElementById('world-scale-value').innerText = scale;
	document.getElementById('world-persistence-value').innerText = persistence;
	document.getElementById('world-lacunarity-value').innerText = lacunarity;
	document.getElementById('world-multiplier-value').innerText = multiplier;
	document.getElementById('ocean-depth-value').innerText = depth;
	document.getElementById('ocean-depthMultiplier-value').innerText = depthMultiplier;
	document.getElementById('ocean-smoothing-value').innerText = smoothing;
	document.getElementById('mountain-numLayers-value').innerText = numLayers;
	document.getElementById('mountain-scale-value').innerText = scale;
	document.getElementById('mountain-blend-value').innerText = blend;
	document.getElementById('mountain-persistence-value').innerText = persistence;
	document.getElementById('mountain-lacunarity-value').innerText = lacunarity;
	document.getElementById('mountain-multiplier-value').innerText = multiplier;
	document.getElementById('mountain-power-value').innerText = power;
	document.getElementById('mountain-gain-value').innerText = gain;
	document.getElementById('mountain-offset-value').innerText = offset;
	document.getElementById('mountain-verticalShift-value').innerText = verticalShift;
	document.getElementById('sea-line-value').innerText = seaLine;
}

// Control de la calesita de rotación
var timer;
var ROTATION_SPEED = 3;
function AutoRotate(param) {
	// Si hay que girar...
	if (param.checked) {
		// Vamos rotando una cantiad constante cada 30 ms
		timer = setInterval(function () {
			autorot += 0.0005 * ROTATION_SPEED;
			autorot %= 2 * Math.PI;

			// Reenderizamos
			DrawScene();
		}, 30);
	}
	else {
		clearInterval(timer);
	}
}

var lightTimer;
var lightRotX = 35;
var lightRotY = Math.PI;
function AutoRotateLight(param) {
	// Si hay que girar...
	if (param.checked) {
		// Vamos rotando una cantiad constante cada 30 ms
		lightTimer = setInterval(function () {
			lightRotY += 0.0005 * ROTATION_SPEED * 10;
			lightRotY %= 2 * Math.PI;
			var cy = Math.cos(lightRotY);
			var sy = Math.sin(lightRotY);
			var cx = Math.cos(lightRotX);
			var sx = Math.sin(lightRotX);
			meshDrawer.setLightDir(-sy, cy * sx, -cy * cx);
			// Reenderizamos
			DrawScene();
		}, 30);
	}
	else {
		lightRotY = Math.PI;
		var cy = Math.cos(lightRotY);
		var sy = Math.sin(lightRotY);
		var cx = Math.cos(lightRotX);
		var sx = Math.sin(lightRotX);
		meshDrawer.setLightDir(-sy, cy * sx, -cy * cx);
		// Reenderizamos
		DrawScene();

		clearInterval(lightTimer);
	}
}

// Cargar archivo obj
function LoadObj(param) {
	if (param.files && param.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			ReloadWorld();
		}
		reader.readAsText(param.files[0]);
	}
}

function LoadObjFromString(obj, isAtmosphere) {
	var mesh = new ObjMesh;
	mesh.parse(obj);
	var box = mesh.getBoundingBox();
	var shift = [
		-(box.min[0] + box.max[0]) / 2,
		-(box.min[1] + box.max[1]) / 2,
		-(box.min[2] + box.max[2]) / 2
	];
	var size = [
		(box.max[0] - box.min[0]) / 2,
		(box.max[1] - box.min[1]) / 2,
		(box.max[2] - box.min[2]) / 2
	];
	var maxSize = Math.max(size[0], size[1], size[2]);
	var scale = 1 / maxSize;
	mesh.shiftAndScale(shift, scale);
	var buffers = mesh.getVertexBuffers();
	if (!isAtmosphere) {
		meshDrawer.setMesh(buffers.positionBuffer, buffers.normalBuffer);
	} else {
		meshDrawer.setAtmosphereMesh(buffers.positionBuffer, buffers.normalBuffer);
	}
	DrawScene();
}

// Cargar textura
function LoadTexture(param) {
	if (param.files && param.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var img = document.getElementById('texture-img');
			img.onload = function () {
				meshDrawer.setTexture(img);
				DrawScene();
			}
			img.src = e.target.result;
		};
		reader.readAsDataURL(param.files[0]);
	}
}

function LoadAtmosphere() {
	var img = document.getElementById('texture-img');
	img.onload = function () {
		meshDrawer.setTexture(img);
		DrawScene();
	}
	img.src = "./textures/clouds.jpg";
}


// Setear Intensidad
function SetShininess(param) {
	var exp = param.value;
	var s = Math.pow(10, exp / 25);
	document.getElementById('shininess-value').innerText = s.toFixed(s < 10 ? 2 : 0);
	meshDrawer.setShininess(s);
	DrawScene();
}

function SetAtmosphere(param) {
	meshDrawer.setAtmosphere(param.checked)
	DrawScene();
}

function LoadPlanet(param) {
	if (param.files && param.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			let lines = e.target.result.split("\n");

			size = parseInt(lines[0]);
			seed = parseInt(lines[1]);
			let i = 2;
			for (const obj of [continentOpts, oceanOpts, mountainOpts]) {
				for (const key in obj) {
					obj[key] = parseFloat(lines[i]);
					i++;
				}
			}
			ReloadWorld();
			ChangeSeaLine(parseInt(lines[i]));
			DrawScene();
		};
		reader.readAsText(param.files[0]);
	}
}

function ExportPlanetSettings() {
	let file = "";

	file += size + "\n";
	file += seed + "\n";
	for (const obj of [continentOpts, oceanOpts, mountainOpts]) {
		for (const key in obj) {
			file += obj[key] + "\n";
		}
	}
	file += oceanLine + "\n";

	download("myPlanet.plnt", file);
}

function ExportPlanetObj() {
	download("myPlanet.obj", new SphereCreator().createSphere(size, seed, continentOpts, oceanOpts, mountainOpts));
}