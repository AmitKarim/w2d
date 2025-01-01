import { mat2, mat2d, vec2 } from 'gl-matrix'
import { createShader } from './Shader'
import { Texture } from './TextureManager'

const VertexShaderSrc = `#version 300 es

in vec2 aPos;
in vec2 aUV;

out vec2 vUV;
void main() {
    vUV = aUV;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D tex;
in vec2 vUV;
out vec4 fragColor;
void main() {
    fragColor = texture(tex, vUV);
}
`
export function createTexturedQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['tex'],
        ['aPos', 'aUV']
    )
}

export type TexturedQuadShader = ReturnType<typeof createTexturedQuadShader>

export const FloatsPerQuad = 16
export const IntsPerQuad = 6

export function drawQuad(
    pos: vec2,
    angle: number,
    cameraPos: vec2,
    width: number,
    height: number,
    tex: Texture,
    vertices: Float32Array,
    verticesIdx: number,
    indices: Uint32Array,
    indicesIdx: number
): boolean {
    // 8 vertices and 8 uvs
    if (verticesIdx + 16 >= vertices.length) {
        return false
    }
    if (indicesIdx + 6 > indices.length) {
        return false
    }

    const v1 = vec2.create()
    const transformedPos = vec2.create()
    const mat = mat2d.create()
    vec2.subtract(transformedPos, pos, cameraPos)
    mat2d.fromTranslation(mat, transformedPos)
    mat2d.rotate(mat, mat, angle)

    const halfWidth = width / 2
    const halfHeight = height / 2

    v1[0] = -halfHeight
    v1[1] = -halfHeight
    vec2.transformMat2d(v1, v1, mat)
    vertices[verticesIdx] = v1[0]
    vertices[verticesIdx + 1] = v1[1]
    vertices[verticesIdx + 2] = tex.u[0]
    vertices[verticesIdx + 3] = tex.v[1]

    v1[0] = halfWidth
    v1[1] = -halfHeight
    vec2.transformMat2d(v1, v1, mat)
    vertices[verticesIdx + 4] = v1[0]
    vertices[verticesIdx + 5] = v1[1]
    vertices[verticesIdx + 6] = tex.u[1]
    vertices[verticesIdx + 7] = tex.v[1]

    v1[0] = halfWidth
    v1[1] = halfHeight
    vec2.transformMat2d(v1, v1, mat)
    vertices[verticesIdx + 8] = v1[0]
    vertices[verticesIdx + 9] = v1[1]
    vertices[verticesIdx + 10] = tex.u[1]
    vertices[verticesIdx + 11] = tex.v[0]

    v1[0] = -halfWidth
    v1[1] = halfHeight
    vec2.transformMat2d(v1, v1, mat)
    vertices[verticesIdx + 12] = v1[0]
    vertices[verticesIdx + 13] = v1[1]
    vertices[verticesIdx + 14] = tex.u[0]
    vertices[verticesIdx + 15] = tex.v[0]

    const startIdx = verticesIdx / FloatsPerQuad
    indices[indicesIdx + 0] = startIdx + 2
    indices[indicesIdx + 1] = startIdx + 3
    indices[indicesIdx + 2] = startIdx + 0
    indices[indicesIdx + 3] = startIdx + 0
    indices[indicesIdx + 4] = startIdx + 1
    indices[indicesIdx + 5] = startIdx + 2
    return true
}
