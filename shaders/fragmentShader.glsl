precision mediump float;

uniform sampler2D texGPU;

uniform mat4 mv;
uniform mat3 mn;
uniform vec3 lightDir;
uniform float shininess;
uniform float seaLine;

in vec3 normCoord;
in vec4 vertCoord;
in vec4 texCoord;

const vec4 seaColor = vec4(0.18, 0.53, 0.82, 1);
const vec4 earthColor = vec4(0.3, 0.65, 0.25, 1);
const vec4 beachColor = vec4(0.89, 0.76, 0.33, 1);
const vec4 mountainColor = vec4(0.7, 0.85, 0.88, 1);
const vec4 mountainTopColor = vec4(0.7, 0.85, 0.88, 1);

const float beachThreshold = 0.005;
const float earthThreshold = 0.1;
const float mountainThreshold = 0.15;

out vec4 fragColor;

const float SCALE_FACTOR = 0.2;
const float SHARPNESS = 0.0;

vec4 getAtmosphere() {
	vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 Ks = I;
    vec4 Ia = vec4(0.2, 0.2, 0.2, 0.2);

	vec4 tx = mv * texCoord;

    vec2 uvX = tx.zy * SCALE_FACTOR;
    vec2 uvY = tx.xz * SCALE_FACTOR;
    vec2 uvZ = tx.xy * SCALE_FACTOR;

    vec4 xColor = texture(texGPU, uvX);
    vec4 yColor = texture(texGPU, uvY);
    vec4 zColor = texture(texGPU, uvZ);

    vec3 blendWeight = pow(abs(normCoord), vec3(SHARPNESS, SHARPNESS, SHARPNESS));
    blendWeight /= dot(blendWeight, vec3(1.0, 1.0, 1.0));

    vec4 Kd = xColor * blendWeight.x + yColor * blendWeight.y + zColor * blendWeight.z;
    vec4 Ka = Kd;
    Ka.x /= 2.0;
    Ka.y /= 2.0;
    Ka.z /= 2.0; // Darken color when unlighted

    float surfaceShininessFactor = 100000.0;
    vec3 n = mn * normCoord;
    float cosTheta = dot(n, lightDir);
    vec4 v = -(mv * tx);
    vec4 h = normalize(vec4(lightDir, 1) + v);
    float cosOmega = dot(vec4(n, 1), h);
    vec4 lightedColor = I * max(0.0, cosTheta) * (Kd + Ks * pow(max(0.0, cosOmega), shininess * surfaceShininessFactor) / cosTheta) + Ia * Ka;
    lightedColor.w = min(lightedColor.x, min(lightedColor.y, lightedColor.z));

	return lightedColor;
}

void main()
{
	vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
	vec4 Ks = I;
	vec4 Ia = vec4(0.2, 0.2, 0.2, 0.2);

	vec4 Kd;
	
	float height = distance(vec4(0,0,0,1), vertCoord);
	float surfaceShininessFactor = 100000.0;
	if (height > seaLine && height < seaLine + beachThreshold) {
		Kd = beachColor;
	} else if (height > seaLine + beachThreshold && height < seaLine + earthThreshold) {
		Kd = earthColor;
	} else if (height > seaLine + earthThreshold && height < seaLine + mountainThreshold) {
		Kd = mountainColor;
		surfaceShininessFactor = 2.0;
	} else if (height > seaLine + mountainThreshold) {
		Kd = mountainTopColor;
	} else {
		Kd = seaColor;
		surfaceShininessFactor = 1.0;
	}

	vec4 Ka = Kd;
	Ka.x /= 2.0;
	Ka.y /= 2.0;
	Ka.z /= 2.0; // Darken color when unlighted

	vec3 n = mn * normCoord;
	float cosTheta = dot(n, lightDir);
	vec4 v = -(mv * vertCoord);
	vec4 h = normalize(vec4(lightDir, 1) + v);
	float cosOmega = dot(vec4(n, 1), h);
	vec4 surfaceColor = I * max(0.0, cosTheta) * (Kd + Ks * pow(max(0.0, cosOmega), shininess * surfaceShininessFactor) / cosTheta) + Ia * Ka;

	fragColor = surfaceColor + getAtmosphere() / surfaceShininessFactor / 4.0;
}