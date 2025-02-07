// Torender a particle system:
// 1. Two buffers for transform feedback
// 2. One buffer for vertex geometry - for instanced calls - shared by all systems

import { vec2, vec3 } from 'gl-matrix'
import {
    createExplosionSpawner,
    createParticleUpdateShader,
} from '../shaders/ParticleShaders'
import { MaxView, World } from '../../World'
import { hsbToRgb, hueShift, rgbToHsb } from '../HSBColor'

// Particle generation will generate both vertices at the same time
// Properties per vertex:
// 1. Position - vec2
// 2. Velocity - vec2
// 3. Color: vec4
// 4. Lifetime - float
// 5. Age - float

// When creating the particle system
// 1. Bind generation shader
// 2. Write to buffer 0
// 3. Draw call to generate particles * num particles
// 4. Frame over frame - run particle update and render
// 5. When particles expire - write back over

const NumParticleSystems = 500
const NumParticlesPerSystem = 128
const BytesPerParticle = 8 + 8 + 16 + 4 + 4
const BytesPerSystem = BytesPerParticle * NumParticlesPerSystem

type CreateParticleExplosion = {
    position: vec2
    size: number
    lifeTime: number
}

type ActiveParticleExplosion = {
    lifeTime: number
    age: number
}

const NewExplosions: CreateParticleExplosion[] = []
const ActiveExplosions: ActiveParticleExplosion[] = []
const ReferenceColor = vec3.scale(
    vec3.create(),
    vec3.fromValues(107, 218, 255),
    1 / 255.0
)

export function createNewParticleExplosion(params: CreateParticleExplosion) {
    NewExplosions.push(params)
}

function createRandomTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const randomTexture = gl.createTexture()
    const textureWidth = NumParticlesPerSystem
    const textureHeight = 1024
    const randomData = new Float32Array(textureWidth * textureHeight)
    for (let i = 0; i < randomData.length; i++) {
        randomData[i] = Math.random()
    }
    gl.bindTexture(gl.TEXTURE_2D, randomTexture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,
        textureWidth,
        textureHeight,
        0,
        gl.RED,
        gl.FLOAT,
        randomData
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return randomTexture
}
export function createParticleRenderer(
    gl: WebGL2RenderingContext,
    world: World
) {
    const particleSpawnerShader = createExplosionSpawner(gl)
    const particleUpdateShader = createParticleUpdateShader(gl)
    const randomTexture = createRandomTexture(gl)

    const hsbColor = rgbToHsb(ReferenceColor)

    const createVertexArray = (buffer: WebGLBuffer) => {
        const updateVOA = gl.createVertexArray()
        gl.bindVertexArray(updateVOA)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            BytesPerSystem * NumParticleSystems,
            gl.DYNAMIC_COPY
        )
        gl.vertexAttribPointer(
            particleUpdateShader.attributes.aPos,
            2,
            gl.FLOAT,
            false,
            BytesPerParticle,
            0
        )
        gl.enableVertexAttribArray(particleUpdateShader.attributes.aPos)
        gl.vertexAttribPointer(
            particleUpdateShader.attributes.aVel,
            2,
            gl.FLOAT,
            false,
            BytesPerParticle,
            8
        )
        gl.enableVertexAttribArray(particleUpdateShader.attributes.aVel)
        gl.vertexAttribPointer(
            particleUpdateShader.attributes.aColor,
            4,
            gl.FLOAT,
            true,
            BytesPerParticle,
            16
        )
        gl.enableVertexAttribArray(particleUpdateShader.attributes.aColor)
        gl.vertexAttribPointer(
            particleUpdateShader.attributes.aLifetime,
            1,
            gl.FLOAT,
            false,
            BytesPerParticle,
            32
        )
        gl.enableVertexAttribArray(particleUpdateShader.attributes.aLifetime)
        gl.vertexAttribPointer(
            particleUpdateShader.attributes.aAge,
            1,
            gl.FLOAT,
            false,
            BytesPerParticle,
            36
        )
        gl.enableVertexAttribArray(particleUpdateShader.attributes.aAge)
        gl.bindVertexArray(null)
        return updateVOA
    }

    const spawnerVOA = gl.createVertexArray()
    gl.bindVertexArray(spawnerVOA)
    const uniqueIDBuffer = gl.createBuffer()
    const uniqueIDs = new Float32Array(NumParticlesPerSystem)
    for (let i = 0; i < NumParticlesPerSystem; ++i) {
        uniqueIDs[i] = i / NumParticlesPerSystem
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uniqueIDBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, uniqueIDs, gl.STATIC_DRAW)
    gl.vertexAttribPointer(
        particleSpawnerShader.attributes.aUnique,
        1,
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.enableVertexAttribArray(particleSpawnerShader.attributes.aUnique)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    let buffer1 = gl.createBuffer()
    let buffer2 = gl.createBuffer()
    let updateVOA1 = createVertexArray(buffer1)
    let updateVOA2 = createVertexArray(buffer2)

    let first = true
    return () => {
        if (first) {
            first = false
            createNewParticleExplosion({
                position: vec2.fromValues(200, 200),
                size: 1,
                lifeTime: 2.0,
            })
        }
        // By convention we are always rendering from 1 to 2

        // First identify if any particle systems have expired
        // The last item in memory is the last item in the list
        gl.bindBuffer(gl.COPY_READ_BUFFER, buffer1)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, buffer1)
        for (let i = ActiveExplosions.length - 1; i >= 0; --i) {
            const explosion = ActiveExplosions[i]
            if (explosion.age >= explosion.lifeTime) {
                // We need to remove this data from buffer 1
                if (i !== ActiveExplosions.length - 1) {
                    // We need to swap this element with the backmost
                    // also swap the memory
                    // Read the last system
                    const readOffset =
                        (ActiveExplosions.length - 1) * BytesPerSystem
                    const writeOffset = i * BytesPerSystem
                    gl.copyBufferSubData(
                        gl.COPY_READ_BUFFER,
                        gl.COPY_WRITE_BUFFER,
                        readOffset,
                        writeOffset,
                        BytesPerSystem
                    )
                    ActiveExplosions[i] =
                        ActiveExplosions[ActiveExplosions.length - 1]
                }
                ActiveExplosions.pop()
            }
        }
        gl.bindBuffer(gl.COPY_READ_BUFFER, null)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, null)

        // First render any new instances - they need to be rendered to buffer1
        // They will be rendered after any existing data
        if (NewExplosions.length > 0) {
            // Start generating our new vertices
            gl.useProgram(particleSpawnerShader.program)
            gl.bindVertexArray(spawnerVOA)
            gl.bindBufferRange(
                gl.TRANSFORM_FEEDBACK_BUFFER,
                0,
                buffer1,
                ActiveExplosions.length * BytesPerSystem,
                BytesPerSystem * (NumParticleSystems - ActiveExplosions.length)
            )
            gl.beginTransformFeedback(gl.POINTS)
            gl.uniform1f(
                particleSpawnerShader.uniforms.time,
                world.time.elapsed
            )
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, randomTexture)
            gl.uniform1i(particleSpawnerShader.uniforms.randomTexture, 0)

            for (const explosion of NewExplosions) {
                // Representations for the data that will be added
                for (let i = 0; i < explosion.size; ++i) {
                    ActiveExplosions.push({
                        age: 0,
                        lifeTime: explosion.lifeTime,
                    })
                }
                gl.uniform2fv(
                    particleSpawnerShader.uniforms.position,
                    explosion.position
                )
                gl.uniform1f(
                    particleSpawnerShader.uniforms.lifetime,
                    explosion.lifeTime
                )
                const newColor = hsbToRgb(hueShift(hsbColor, Math.random()))
                gl.uniform3fv(particleSpawnerShader.uniforms.color, newColor)

                const numParticles = NumParticlesPerSystem * explosion.size

                gl.enable(gl.RASTERIZER_DISCARD)
                gl.drawArrays(gl.POINTS, 0, numParticles)
                gl.disable(gl.RASTERIZER_DISCARD)
            }
            gl.endTransformFeedback()
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)
            gl.bindVertexArray(null)
            gl.useProgram(null)

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer1)
            const result = new Float32Array(1000)
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, result)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            NewExplosions.length = 0
        }

        // Do the actual particle update and render to screen
        if (ActiveExplosions.length !== 0) {
            const deltaTime = world.time.delta
            gl.useProgram(particleUpdateShader.program)
            gl.bindVertexArray(updateVOA1)
            gl.uniform1f(particleUpdateShader.uniforms.deltaTime, deltaTime)
            gl.uniform2fv(
                particleUpdateShader.uniforms.cameraPos,
                world.render.cameraPos
            )
            gl.uniform2f(
                particleUpdateShader.uniforms.screenSize,
                1.0 / MaxView,
                world.screen.width / world.screen.height / MaxView
            )
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer2)
            gl.beginTransformFeedback(gl.LINES)

            const numParticles = NumParticlesPerSystem * ActiveExplosions.length
            gl.drawArrays(gl.LINES, 0, numParticles * 2)

            gl.endTransformFeedback()
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)

            gl.bindVertexArray(null)
            gl.useProgram(null)

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer2)
            const result = new Float32Array(1000)
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, result)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

            ActiveExplosions.forEach((x) => (x.age += deltaTime))
        }

        const tmpBuffer = buffer1
        buffer1 = buffer2
        buffer2 = tmpBuffer

        const tmpVOA = updateVOA1
        updateVOA1 = updateVOA2
        updateVOA2 = tmpVOA
    }
}
