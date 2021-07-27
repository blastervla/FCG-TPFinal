precision mediump float;
uniform sampler2D texGPU;
uniform int useTex;
varying vec2 texCoord;

void main()
{
    if (useTex == 1) {
        gl_FragColor = texture2D(texGPU, texCoord);
    } else {
        gl_FragColor = vec4(1, 0, gl_FragCoord.z * gl_FragCoord.z, 1);
    }
}