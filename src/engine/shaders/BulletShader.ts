import { createShader } from '../Shader'

const VertexShaderSrc = `#version 300 es

uniform vec2 screenSize;
uniform vec2 cameraPos;
in vec2 aPos;

void main() {
    gl_Position = vec4((aPos - cameraPos) * screenSize, 1.0, 1.0);
}
`

const FragmentShaderSrc = `#version 300 es
precision mediump float;

uniform vec3 color;
out vec4 fragColor;
void main() {
    fragColor = vec4(color, 1.0);
}
`

export function createBulletShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['cameraPos', 'screenSize', 'color'],
        ['aPos']
    )
}

export type BulletShader = ReturnType<typeof createBulletShader>
