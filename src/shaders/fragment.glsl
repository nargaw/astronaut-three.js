varying vec2 vUv;

uniform float u_time;

void main(){
    gl_FragColor = vec4(vUv, 0., 1.0);
}