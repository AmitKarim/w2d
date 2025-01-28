import { createShader } from '../Shader'

const VertexShaderSrc = `#version 300 es

uniform vec2 screenSize;
uniform vec2 cameraPos;
in vec2 aPos;
in vec4 aColor;
out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = vec4((aPos - cameraPos) * screenSize, 1.0, 1.0);
    gl_PointSize = 5.0;
}
`

const FragmentShaderSrc = `#version 300 es
precision mediump float;

in vec4 vColor;
out vec4 fragColor;
void main() {
    fragColor = vColor;
}
`

export function createDebugLineShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['screenSize', 'cameraPos'],
        ['aPos', 'aColor']
    )
}

export type DebugLineShader = ReturnType<typeof createDebugLineShader>
