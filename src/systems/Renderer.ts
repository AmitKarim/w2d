import { defineQuery } from 'bitecs'
import { World } from '../World'
import { mat2d, vec2, mat4, mat3 } from 'gl-matrix'
import { Texture, TextureManager } from '../engine/TextureManager'
import {
    createTexturedQuadShader,
    drawQuad,
    FloatsPerQuad,
    IntsPerQuad,
} from '../engine/TexturedQuadShader'
export type RenderData = {
    gl: WebGL2RenderingContext
    cameraPos: vec2
}

export async function createRenderFunc(world: World): Promise<() => void> {
    const PlayerEntitiesQuery = defineQuery([world.components.Player])

    const { gl } = world.render
    const quadShader = createTexturedQuadShader(gl)

    const vertexPositions = new Float32Array(512)
    const indices = new Uint32Array(512)
    let vIdx = 0
    let iIdx = 0

    const vertexBuffer = gl.createBuffer()
    const indexBuffer = gl.createBuffer()
    gl.enableVertexAttribArray(quadShader.attributes.aPos)
    gl.enableVertexAttribArray(quadShader.attributes.aUV)

    const textureManager = new TextureManager(gl, 'data')
    const playerTexture = await textureManager.createTexture('player.png')

    return () => {
        const { gl } = world.render
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(quadShader.program)

        const Players = PlayerEntitiesQuery(world)
        const entityPos = vec2.create()

        iIdx = 0
        vIdx = 0
        for (const Player of Players) {
            entityPos[0] = world.components.Position.xpos[Player]
            entityPos[1] = world.components.Position.ypos[Player]
            drawQuad(
                entityPos,
                world.components.Position.angle[Player],
                world.render.cameraPos,
                world.components.Sprite.width[Player],
                world.components.Sprite.height[Player],
                playerTexture,
                vertexPositions,
                vIdx,
                indices,
                iIdx
            )
            vIdx += FloatsPerQuad
            iIdx += IntsPerQuad
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertexPositions,
            gl.DYNAMIC_DRAW,
            0,
            vIdx
        )

        gl.vertexAttribPointer(
            quadShader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            16,
            0
        )
        gl.vertexAttribPointer(
            quadShader.attributes.aUV,
            2,
            gl.FLOAT,
            false,
            16,
            8
        )

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            indices,
            gl.DYNAMIC_DRAW,
            0,
            iIdx
        )
        playerTexture.bind()

        gl.drawElements(gl.TRIANGLES, iIdx, gl.UNSIGNED_INT, 0)
        console.log(vertexPositions[13])
        gl.flush()
    }
}
