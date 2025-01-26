import { createShader } from './Shader'

const VertexShaderSrc = `#version 300 es

uniform vec2 screenSize;
in vec2 aPos;
in float aAlpha;
in vec3 aColor;
in mat3 aTransform;
out vec4 vColor;

void main() {
    vColor = vec4(aColor, aAlpha);
    gl_Position = vec4(aTransform * vec3(aPos, 1.0) * vec3(screenSize, 1.0), 1.0);
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

export function createFeatheredLineShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['screenSize'],
        ['aPos', 'aAlpha', 'aColor', 'aTransform']
    )
}

export type FeatheredLineShader = ReturnType<typeof createFeatheredLineShader>
