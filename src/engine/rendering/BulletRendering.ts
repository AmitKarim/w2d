import {
    Bullet_Length,
    Bullet_Normal,
    Bullet_Pos,
    BulletThickness,
    MAX_BULLETS,
    NumBullets,
} from '../../systems/ProjectileSystem'
import { MaxView, World } from '../../World'
import { createBulletShader } from '../shaders/BulletShader'

export function createBulletRenderer(world: World, gl: WebGL2RenderingContext) {
    const bulletGeometryBuffer = gl.createBuffer()
    const bulletPoints = new Float32Array(MAX_BULLETS * 8)
    const bulletIndexBuffer = gl.createBuffer()
    const bulletIndices = new Uint16Array(MAX_BULLETS * 6)

    const bulletShader = createBulletShader(gl)
    gl.enableVertexAttribArray(bulletShader.attributes.aPos)

    for (let i = 0; i < MAX_BULLETS; ++i) {
        bulletIndices[i * 6 + 0] = i * 4
        bulletIndices[i * 6 + 1] = i * 4 + 1
        bulletIndices[i * 6 + 2] = i * 4 + 2
        bulletIndices[i * 6 + 3] = i * 4 + 2
        bulletIndices[i * 6 + 4] = i * 4 + 3
        bulletIndices[i * 6 + 5] = i * 4
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bulletIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bulletIndices, gl.STATIC_DRAW)

    const render = () => {
        if (NumBullets == 0) {
            return
        }
        if (NumBullets < 0) {
            throw new Error('not possible')
        }

        let normalX = 0
        let normalY = 0
        let lenX = 0
        let lenY = 0
        for (let i = 0; i < NumBullets; ++i) {
            normalX = Bullet_Normal[i * 2] * BulletThickness
            normalY = Bullet_Normal[i * 2 + 1] * BulletThickness
            lenX = Bullet_Normal[i * 2 + 1] * Bullet_Length[i]
            lenY = -Bullet_Normal[i * 2] * Bullet_Length[i]
            bulletPoints[i * 8 + 0] = Bullet_Pos[i * 2] + normalX
            bulletPoints[i * 8 + 1] = Bullet_Pos[i * 2 + 1] + normalY
            bulletPoints[i * 8 + 2] = Bullet_Pos[i * 2] - normalX
            bulletPoints[i * 8 + 3] = Bullet_Pos[i * 2 + 1] - normalY
            bulletPoints[i * 8 + 4] = Bullet_Pos[i * 2] - lenX - normalX
            bulletPoints[i * 8 + 5] = Bullet_Pos[i * 2 + 1] - lenY - normalY
            bulletPoints[i * 8 + 6] = Bullet_Pos[i * 2] - lenX + normalX
            bulletPoints[i * 8 + 7] = Bullet_Pos[i * 2 + 1] - lenY + normalY
        }

        gl.useProgram(bulletShader.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, bulletGeometryBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            bulletPoints,
            gl.DYNAMIC_DRAW,
            0,
            NumBullets * bulletPoints.BYTES_PER_ELEMENT * 8
        )
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bulletIndexBuffer)
        gl.enableVertexAttribArray(bulletShader.attributes.aPos)
        gl.vertexAttribPointer(
            bulletShader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            0,
            0
        )
        gl.uniform2f(
            bulletShader.uniforms.cameraPos,
            world.render.cameraPos[0],
            world.render.cameraPos[1]
        )
        gl.uniform3fv(
            bulletShader.uniforms.color,
            [235, 177, 52].map((x) => x / 255)
        )
        gl.uniform2f(
            bulletShader.uniforms.screenSize,
            1.0 / MaxView,
            world.screen.width / world.screen.height / MaxView
        )
        gl.drawElements(gl.TRIANGLES, NumBullets * 6, gl.UNSIGNED_SHORT, 0)
    }
    return render
}
