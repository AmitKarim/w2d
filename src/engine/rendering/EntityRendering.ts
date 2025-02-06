import { mat3, vec2 } from 'gl-matrix'
import { createFeatheredLineShader } from '../shaders/FeatheredLineShader'
import { ShapeGeometry, Shapes, ShapeType } from '../Shapes'
import { defineQuery, Query } from 'bitecs'
import { MaxView, World } from '../../World'

type GeometryBufferOffset = {
    indexStart: number
    indexCount: number
}
const MaxEntitiesPerType = 256

export function createEntityRenderer(
    gl: WebGL2RenderingContext,
    world: World,
    player: number
) {
    const lineShader = createFeatheredLineShader(gl)
    const shapeGeometryOffsets: Record<ShapeType, GeometryBufferOffset> =
        {} as any
    const shipGeometry = gl.createBuffer()
    const shipIndexBuffer = gl.createBuffer()
    {
        let totalFloats = 0
        let totalIndices = 0
        for (const s of Shapes) {
            const entry = ShapeGeometry[s]
            totalFloats += entry.visual.points.length
            totalIndices += entry.visual.indices.length
        }
        const arrayData = new Float32Array(totalFloats)
        const indexData = new Uint16Array(totalIndices)

        let vIdx = 0
        let iIdx = 0
        for (const s of Shapes) {
            const geometry = ShapeGeometry[s]
            arrayData.set(geometry.visual.points, vIdx)
            indexData.set(
                geometry.visual.indices.map((x) => x + vIdx / 3),
                iIdx
            )

            shapeGeometryOffsets[s] = {
                indexStart: iIdx,
                indexCount: geometry.visual.indices.length,
            }
            vIdx += geometry.visual.points.length
            iIdx += geometry.visual.indices.length
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, shipGeometry)
        gl.bufferData(gl.ARRAY_BUFFER, arrayData, gl.STATIC_DRAW, 0)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shipIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW)
    }

    const drawGeometryInstanced = (
        geometryType: ShapeType,
        instanceCount: number
    ) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, shipGeometry)
        gl.enableVertexAttribArray(lineShader.attributes.aPos)
        gl.vertexAttribPointer(
            lineShader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            12,
            0
        )
        gl.enableVertexAttribArray(lineShader.attributes.aAlpha)
        gl.vertexAttribPointer(
            lineShader.attributes.aAlpha,
            1,
            gl.FLOAT,
            false,
            12,
            8
        )
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shipIndexBuffer)

        const offset = shapeGeometryOffsets[geometryType]
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            offset.indexCount,
            gl.UNSIGNED_SHORT,
            offset.indexStart * 2,
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
        true,
        0,
        0
    )
    gl.vertexAttribDivisor(lineShader.attributes.aColor, 1)
    const setColorData = (r: number, g: number, b: number, idx: number) => {
        colorData[idx * 3] = r
        colorData[idx * 3 + 1] = g
        colorData[idx * 3 + 2] = b
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
    const toMat3 = (pos: vec2, angle: number, mat: mat3) => {
        mat3.fromTranslation(mat, pos)
        mat3.rotate(mat, mat, angle)
        return mat
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

    const shapeHelpers: Record<
        Exclude<ShapeType, 'player'>,
        {
            query: Query<World>
            component: typeof world.components.Shapes.Diamond
        }
    > = {
        crossed_diamond: {
            query: defineQuery([
                world.components.Shapes.CrossedDiamond,
                world.components.Color,
            ]),
            component: world.components.Shapes.CrossedDiamond,
        },
        diamond: {
            query: defineQuery([
                world.components.Shapes.Diamond,
                world.components.Color,
            ]),
            component: world.components.Shapes.Diamond,
        },
    }

    const modelMatrix = mat3.create()
    const drawShapes = (type: Exclude<ShapeType, 'player'>) => {
        const { query } = shapeHelpers[type]
        const entities = query(world)
        for (let i = 0; i < entities.length; ++i) {
            setTransformData(
                toMat3(
                    world.components.Position.pos[entities[i]],
                    world.components.Position.angle[entities[i]],
                    modelMatrix
                ),
                i
            )
            setColorData(
                world.components.Color.color[entities[i]][0],
                world.components.Color.color[entities[i]][1],
                world.components.Color.color[entities[i]][2],
                i
            )
        }
        bufferTransformData(entities.length)
        bufferColorData(entities.length)
        drawGeometryInstanced(type, entities.length)
    }

    const playerMat = mat3.create()

    return () => {
        gl.useProgram(lineShader.program)
        toMat3(
            world.components.Position.pos[player],
            world.components.Position.angle[player],
            playerMat
        )
        setColorData(152, 242, 255, 0)
        setTransformData(playerMat, 0)
        gl.uniform2f(
            lineShader.uniforms.screenSize,
            1.0 / MaxView,
            world.screen.width / world.screen.height / MaxView
        )
        gl.uniform2f(
            lineShader.uniforms.cameraPos,
            world.render.cameraPos[0],
            world.render.cameraPos[1]
        )
        bufferColorData(1)
        bufferTransformData(1)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)

        drawGeometryInstanced('player', 1)

        for (const key of Shapes) {
            if (key == 'player') {
                continue
            }
            drawShapes(key)
        }
        gl.disable(gl.BLEND)
    }
}
