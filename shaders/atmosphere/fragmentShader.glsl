precision mediump float;
uniform sampler2D texGPU;

uniform mat4 mv;
uniform mat3 mn;
uniform vec3 lightDir;
uniform float shininess;

varying vec4 vertCoord;
varying vec3 normCoord;

const float SCALE_FACTOR = 0.2;
const float SHARPNESS = 10.0;

void main() {
    vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 Ks = I;
    vec4 Ia = vec4(0.2, 0.2, 0.2, 0.2);

    // Hacemos triplanar mapping. Para la atmosfera nos va a sobrar con hacer esto
    vec2 uvX = vertCoord.zy * SCALE_FACTOR;
    vec2 uvY = vertCoord.xz * SCALE_FACTOR;
    vec2 uvZ = vertCoord.xy * SCALE_FACTOR;

    vec4 xColor = texture2D(texGPU, uvX);
    vec4 yColor = texture2D(texGPU, uvY);
    vec4 zColor = texture2D(texGPU, uvZ);

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
    vec4 v = -(mv * vertCoord);
    vec4 h = normalize(vec4(lightDir, 1) + v);
    float cosOmega = dot(vec4(n, 1), h);
    vec4 lightedColor = I * max(0.0, cosTheta) * (Kd + Ks * pow(max(0.0, cosOmega), shininess * surfaceShininessFactor) / cosTheta) + Ia * Ka;
    lightedColor.w = min(lightedColor.x, min(lightedColor.y, lightedColor.z));
    gl_FragColor = lightedColor;
}