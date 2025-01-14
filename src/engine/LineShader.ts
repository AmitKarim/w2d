import { createShader } from './Shader'

const VertexShaderSrc = `#version 300 es

uniform float halfThickness;
uniform vec2 screenSize;
in vec2 aPos;
in vec2 aNormal;
in float aMiter;
in vec3 aColor;
in mat3 aTransform;
out vec3 vColor;

void main() {
    vColor = aColor;
    vec2 pos = aPos + (aNormal * halfThickness * aMiter); 
    gl_Position = vec4(aTransform * vec3(pos, 1.0) * vec3(screenSize, 1.0), 1.0);
}
`

const FragmentShaderSrc = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`

export function createLineShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['halfThickness', 'screenSize'],
        ['aPos', 'aNormal', 'aMiter', 'aColor', 'aTransform']
    )
}

export type LineShader = ReturnType<typeof createLineShader>
