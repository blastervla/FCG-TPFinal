vec4 _permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 _taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float smoothMax(float a, float b, float k) {
	 k = min(0.0, -k);
	 float h = max(0.0, min(1.0, (b - a + k) / (2.0 * k)));
	 return a * h + b * (1.0 - h) - k * h * (1.0 - h);
}