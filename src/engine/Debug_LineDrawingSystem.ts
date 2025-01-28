import { vec2, vec4 } from 'gl-matrix'
import { createDebugLineShader } from './shaders/DebugLineShader'

const Debug_BytesPerLine = 24
const Debug_LineDrawingBuffer = new ArrayBuffer(1000 * Debug_BytesPerLine)
const Debug_VerticesBuffer = new DataView(Debug_LineDrawingBuffer)
let Debug_LineDrawingBufferIdx = 0

export function Debug_DrawLine(start: vec2, end: vec2, color: vec4): void {
    Debug_VerticesBuffer.setFloat32(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine,
        start[0]
    )
    Debug_VerticesBuffer.setFloat32(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 4,
        start[1]
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 8,
        color[0] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 9,
        color[1] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 10,
        color[2] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 11,
        color[3] * 255.0
    )
    Debug_VerticesBuffer.setFloat32(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 12,
        end[0]
    )
    Debug_VerticesBuffer.setFloat32(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 16,
        end[1]
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 20,
        color[0] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 21,
        color[1] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 22,
        color[2] * 255.0
    )
    Debug_VerticesBuffer.setUint8(
        Debug_LineDrawingBufferIdx * Debug_BytesPerLine + 23,
        color[3] * 255.0
    )
    ++Debug_LineDrawingBufferIdx
}

export function createDebugRenderer(gl: WebGL2RenderingContext) {
    const debugVerticesBuffer = gl.createBuffer()
    const shader = createDebugLineShader(gl)
    return (cameraPos: vec2, screenSize: vec2) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, debugVerticesBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, Debug_LineDrawingBuffer, gl.DYNAMIC_DRAW)
        gl.useProgram(shader.program)
        gl.uniform2fv(shader.uniforms.cameraPos, cameraPos)
        gl.uniform2fv(shader.uniforms.screenSize, screenSize)
        gl.enableVertexAttribArray(shader.attributes.aPos)
        gl.enableVertexAttribArray(shader.attributes.aColor)
        gl.vertexAttribPointer(
            shader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            12,
            0
        )
        gl.vertexAttribPointer(
            shader.attributes.aColor,
            4,
            gl.UNSIGNED_BYTE,
            true,
            12,
            8
        )

        gl.drawArrays(gl.LINES, 0, Debug_LineDrawingBufferIdx * 2)
        Debug_LineDrawingBufferIdx = 0
    }
}
