precision mediump float;

	uniform sampler2D texGPU;
	uniform int useTex;

	uniform mat4 mv;
	uniform mat3 mn;
	uniform vec3 lightDir;
	uniform float shininess;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{
		vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
		vec4 Kd = vec4(54.0 / 255.0, 130.0 / 255.0, 216.0 / 255.0, 1.0);
		vec4 Ks = I;
		vec4 Ia = vec4(0.2, 0.2, 0.2, 0.2);
		vec4 Ka = vec4(140.0 / 255.0, 175.0 / 255.0, 158.0 / 255.0, 1.0);

		if (useTex == 1) {
			Kd = texture2D(texGPU, texCoord);
		}
		
		vec3 n = mn * normCoord;
		float cosTheta = dot(n, lightDir);
		vec4 v = -(mv * vertCoord);
		vec4 h = normalize(vec4(lightDir, 1) + v);
		float cosOmega = dot(vec4(n, 1), h);
		gl_FragColor = I * max(0.0, cosTheta) * (Kd + Ks * pow(max(0.0, cosOmega), shininess) / cosTheta) + Ia * Ka;
	}