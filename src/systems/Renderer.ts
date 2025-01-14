import { MaxView, World } from '../World'
import { vec2, mat3 } from 'gl-matrix'
import { createLineShader } from '../engine/LineShader'
import {
    EntityGeometry,
    EntityType,
    EntityTypes,
} from '../engine/EntityGeometry'

export type RenderData = {
    gl: WebGL2RenderingContext
    cameraPos: vec2
}

export type GeometryBufferOffset = {
    indexStart: number
    indexCount: number
}

const MaxEntitiesPerType = 256

export async function createRenderFunc(
    world: World,
    player: number
): Promise<() => void> {
    const { gl } = world.render
    const lineShader = createLineShader(gl)

    const entityGeometryOffsets: Record<EntityType, GeometryBufferOffset> =
        {} as any

    const shipGeometry = gl.createBuffer()
    const shipIndexBuffer = gl.createBuffer()
    {
        let totalFloats = 0
        let totalIndices = 0
        for (const entityType of EntityTypes) {
            const entry = EntityGeometry[entityType]
            totalFloats += entry.points.length * 2
            totalFloats += entry.normals.length * 2
            totalFloats += entry.miters.length
            totalIndices += entry.indices.length
        }
        const arrayData = new Float32Array(totalFloats)
        const indexData = new Uint16Array(totalIndices)

        let vIdx = 0
        let iIdx = 0
        for (const entityType of EntityTypes) {
            const geometry = EntityGeometry[entityType]

            entityGeometryOffsets[entityType] = {
                indexStart: iIdx,
                indexCount: geometry.indices.length,
            }

            const startIdx = vIdx
            for (let i = 0; i < geometry.points.length; ++i) {
                arrayData[vIdx] = geometry.points[i][0]
                arrayData[vIdx + 1] = geometry.points[i][1]
                arrayData[vIdx + 2] = geometry.normals[i][0]
                arrayData[vIdx + 3] = geometry.normals[i][1]
                arrayData[vIdx + 4] = geometry.miters[i]
                vIdx += 5
            }
            for (const idx of geometry.indices.map((x) => x + startIdx)) {
                indexData[iIdx] = idx
                ++iIdx
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, shipGeometry)
        gl.bufferData(gl.ARRAY_BUFFER, arrayData, gl.STATIC_DRAW, 0, vIdx)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shipIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW)
    }
    const drawGeometryInstanced = (
        geometryType: EntityType,
        instanceCount: number
    ) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, shipGeometry)
        gl.enableVertexAttribArray(lineShader.attributes.aPos)
        gl.vertexAttribPointer(
            lineShader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            20,
            0
        )
        gl.enableVertexAttribArray(lineShader.attributes.aNormal)
        gl.vertexAttribPointer(
            lineShader.attributes.aNormal,
            2,
            gl.FLOAT,
            false,
            20,
            8
        )
        gl.enableVertexAttribArray(lineShader.attributes.aMiter)
        gl.vertexAttribPointer(
            lineShader.attributes.aMiter,
            1,
            gl.FLOAT,
            false,
            20,
            16
        )
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shipIndexBuffer)

        const offset = entityGeometryOffsets[geometryType]
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            offset.indexCount,
            gl.UNSIGNED_SHORT,
            offset.indexStart,
            instanceCount
        )
    }
    const colorData = new Uint8Array(MaxEntitiesPerType * 3)
    colorData.fill(0)
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(lineShader.attributes.aColor)
    gl.vertexAttribPointer(
        lineShader.attributes.aColor,
        3,
        gl.UNSIGNED_BYTE,
        false,
        0,
        0
    )
    gl.vertexAttribDivisor(lineShader.attributes.aColor, 1)
    const setColorData = (color: number[], idx: number) => {
        colorData[idx * 3] = color[0]
        colorData[idx * 3 + 1] = color[1]
        colorData[idx * 3 + 2] = color[2]
    }
    const bufferColorData = (entityCount: number) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            colorData,
            gl.DYNAMIC_DRAW,
            0,
            entityCount * 3
        )
    }

    const transformData = new Float32Array(MaxEntitiesPerType * 9)
    const transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer)
    for (let i = 0; i < 3; ++i) {
        const rowLoc = lineShader.attributes.aTransform + i
        gl.enableVertexAttribArray(rowLoc)
        gl.vertexAttribPointer(rowLoc, 3, gl.FLOAT, false, 9 * 4, i * 12)
        gl.vertexAttribDivisor(rowLoc, 1)
    }
    const setTransformData = (transform: mat3, idx: number) => {
        transformData[idx * 9 + 0] = transform[0]
        transformData[idx * 9 + 1] = transform[1]
        transformData[idx * 9 + 2] = transform[2]
        transformData[idx * 9 + 3] = transform[3]
        transformData[idx * 9 + 4] = transform[4]
        transformData[idx * 9 + 5] = transform[5]
        transformData[idx * 9 + 6] = transform[6]
        transformData[idx * 9 + 7] = transform[7]
        transformData[idx * 9 + 8] = transform[8]
    }
    const bufferTransformData = (entityCount: number) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            transformData,
            gl.DYNAMIC_DRAW,
            0,
            entityCount * 9
        )
    }

    return () => {
        const { gl } = world.render
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(lineShader.program)

        const entityPos = vec2.create()

        const playerMat = mat3.create()
        entityPos[0] = world.components.Position.xpos[player]
        entityPos[1] = world.components.Position.ypos[player]
        mat3.fromTranslation(playerMat, entityPos)
        mat3.rotate(
            playerMat,
            playerMat,
            world.components.Position.angle[player]
        )
        setColorData([255, 255, 0], 0)
        setTransformData(playerMat, 0)
        gl.uniform1f(lineShader.uniforms.halfThickness, 0.5)
        gl.uniform2f(
            lineShader.uniforms.screenSize,
            1.0 / MaxView,
            world.screen.width / world.screen.height / MaxView
        )
        bufferColorData(1)
        bufferTransformData(1)
        drawGeometryInstanced('player', 1)
        gl.flush()
    }
}
