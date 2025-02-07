import { MaxView, World } from '../World'
import { vec2 } from 'gl-matrix'
import { createDebugRenderer } from '../engine/Debug_LineDrawingSystem'
import { createEntityRenderer } from '../engine/rendering/EntityRendering'
import { createBulletRenderer } from '../engine/rendering/BulletRendering'
import { Shader } from '../engine/Shader'
import {
    createDownSampleBlurQuadShader,
    createToneMapQuadShader,
    createUpSampleAndAddQuadShader,
} from '../engine/shaders/RenderPassQuadShader'
import { createParticleRenderer } from '../engine/rendering/ParticleRendering'

export type RenderData = {
    gl: WebGL2RenderingContext
    cameraPos: vec2
}

function createMultiSampleFrameBuffer(
    gl: WebGL2RenderingContext,
    width: number,
    height: number
) {
    const MSAA_SAMPLES_PER_PIXEL = Math.min(4, gl.getParameter(gl.MAX_SAMPLES))
    const colorRenderBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderBuffer)
    gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        MSAA_SAMPLES_PER_PIXEL,
        gl.R11F_G11F_B10F,
        width,
        height
    )

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.RENDERBUFFER,
        colorRenderBuffer
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    return frameBuffer
}

function blit(
    gl: WebGL2RenderingContext,
    source: WebGLFramebuffer,
    dest: WebGLFramebuffer,
    width: number,
    height: number
) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dest)
    gl.readBuffer(gl.COLOR_ATTACHMENT0)
    gl.drawBuffers([gl.COLOR_ATTACHMENT0])
    gl.blitFramebuffer(
        0,
        0,
        width,
        height,
        0,
        0,
        width,
        height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
    )
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
}

type FrameBufferBundle = {
    frameBuffer: WebGLFramebuffer
    texture: WebGLTexture
    outputSize: [number, number]
    texelSize: [number, number]
}

function createFrameBufferBundle(
    gl: WebGL2RenderingContext,
    width: number,
    height: number
): FrameBufferBundle {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R11F_G11F_B10F, width, height)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return {
        frameBuffer,
        texture,
        outputSize: [width, height],
        texelSize: [1 / width, 1 / height],
    }
}

function createFullscreenRenderPass<
    Uniform extends string,
    T extends Shader<Uniform, 'aPos' | 'aTexCoord'>,
>(gl: WebGL2RenderingContext, shader: T) {
    const quadVAO = gl.createVertexArray()
    gl.bindVertexArray(quadVAO)

    const buffer = gl.createBuffer()
    const vertices = new Float32Array([
        -1, 1, 0, 1, -1, -1, 0, 0, 1, 1, 1, 1, 1, -1, 1, 0,
    ])
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.vertexAttribPointer(shader.attributes.aPos, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(
        shader.attributes.aTexCoord,
        2,
        gl.FLOAT,
        false,
        16,
        8
    )
    gl.enableVertexAttribArray(shader.attributes.aPos)
    gl.enableVertexAttribArray(shader.attributes.aTexCoord)

    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    const render = (
        inputTextures: WebGLTexture[],
        outputFrameBuffer: WebGLFramebuffer | null
    ) => {
        gl.useProgram(shader.program)
        gl.bindVertexArray(quadVAO)
        inputTextures.forEach((x, idx) => {
            gl.activeTexture(gl.TEXTURE0 + idx)
            gl.bindTexture(gl.TEXTURE_2D, x)
        })
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFrameBuffer)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        inputTextures.forEach((_, idx) => {
            gl.activeTexture(gl.TEXTURE0 + idx)
            gl.bindTexture(gl.TEXTURE_2D, null)
        })
        gl.bindVertexArray(null)
        gl.useProgram(null)
    }
    return render
}

// function createLuminanceThresholdRenderPass(gl: WebGL2RenderingContext) {
//     const shader = createLuminanceThresholdQuadShader(gl)
//     const renderPass = createFullscreenRenderPass(gl, shader)
//     return (source: FrameBufferBundle, destination: FrameBufferBundle) => {
//         renderPass([source.texture], destination.frameBuffer)
//     }
// }

// function createHorizontalGaussianBlurRenderPass(gl: WebGL2RenderingContext) {
//     const shader = createHorizontalGaussianBlurQuadShader(gl)
//     const renderPass = createFullscreenRenderPass(gl, shader)
//     return (source: FrameBufferBundle, destination: FrameBufferBundle) => {
//         gl.useProgram(shader.program)
//         renderPass([source.texture], destination.frameBuffer)
//     }
// }

// function createVerticalGaussianBlurRenderPass(gl: WebGL2RenderingContext) {
//     const shader = createVerticalGaussianBlurQuadShader(gl)
//     const renderPass = createFullscreenRenderPass(gl, shader)
//     return (source: FrameBufferBundle, destination: FrameBufferBundle) => {
//         gl.useProgram(shader.program)
//         gl.uniform2fv(shader.uniforms.texelSize, source.texelSize)
//         renderPass([source.texture], destination.frameBuffer)
//     }
// }

function createDownsampleBlurRenderPass(gl: WebGL2RenderingContext) {
    const shader = createDownSampleBlurQuadShader(gl)
    const renderPass = createFullscreenRenderPass(gl, shader)
    return (source: FrameBufferBundle, destination: FrameBufferBundle) => {
        gl.useProgram(shader.program)
        gl.uniform2fv(shader.uniforms.texelSize, source.texelSize)
        gl.viewport(0, 0, ...destination.outputSize)
        renderPass([source.texture], destination.frameBuffer)
    }
}

// function createUpSampleRenderPass(gl: WebGL2RenderingContext) {
//     const shader = createUpSampleQuadShader(gl)
//     const renderPass = createFullscreenRenderPass(gl, shader)

//     gl.useProgram(shader.program)
//     gl.uniform1i(shader.uniforms.smallerSampler, 0)
//     gl.uniform1i(shader.uniforms.largerSampler, 1)
//     gl.useProgram(null)

//     return (
//         smallerSource: FrameBufferBundle,
//         largerSource: FrameBufferBundle,
//         destination: FrameBufferBundle
//     ) => {
//         gl.useProgram(shader.program)
//         gl.uniform2fv(shader.uniforms.texelSize, smallerSource.texelSize)
//         gl.viewport(0, 0, ...destination.outputSize)
//         renderPass(
//             [smallerSource.texture, largerSource.texture],
//             destination.frameBuffer
//         )
//     }
// }

function createUpSampleAndAddRenderPass(gl: WebGL2RenderingContext) {
    const shader = createUpSampleAndAddQuadShader(gl)
    const renderPass = createFullscreenRenderPass(gl, shader)

    gl.useProgram(shader.program)
    gl.uniform1i(shader.uniforms.smallerSampler, 0)
    gl.uniform1i(shader.uniforms.largerSampler, 1)
    gl.useProgram(null)

    return (
        smallerSource: FrameBufferBundle,
        largerSource: FrameBufferBundle,
        destination: FrameBufferBundle
    ) => {
        gl.useProgram(shader.program)
        gl.uniform2fv(shader.uniforms.texelSize, smallerSource.texelSize)
        gl.viewport(0, 0, ...destination.outputSize)
        renderPass(
            [smallerSource.texture, largerSource.texture],
            destination.frameBuffer
        )
    }
}

function createToneMapRenderPass(
    gl: WebGL2RenderingContext,
    width: number,
    height: number
) {
    const shader = createToneMapQuadShader(gl)
    const renderPass = createFullscreenRenderPass(gl, shader)

    return (
        source: FrameBufferBundle,
        destination: FrameBufferBundle | null
    ) => {
        const size = destination
            ? destination.outputSize
            : ([width, height] as [number, number])
        gl.viewport(0, 0, ...size)
        renderPass(
            [source.texture],
            destination ? destination.frameBuffer : null
        )
    }
}

function createBloomPass(
    gl: WebGL2RenderingContext,
    world: World,
    renderGeometry: () => void
) {
    // Necessary for using floating-point buffers
    gl.getExtension('EXT_color_buffer_float')

    const { width, height } = world.screen

    const drawDownSampleBlur = createDownsampleBlurRenderPass(gl)
    const drawUpSampleAdd = createUpSampleAndAddRenderPass(gl)
    const drawToneMap = createToneMapRenderPass(gl, width, height)

    const geometryMultiSampleBuffer = createMultiSampleFrameBuffer(
        gl,
        width,
        height
    )

    const geometryFBBundle = createFrameBufferBundle(gl, width, height)
    const downsampleBlur = [2, 4, 8, 16, 32, 64].map((x) =>
        createFrameBufferBundle(gl, width / x, height / x)
    )
    const upsampleBlur = [32, 16, 8, 4, 2, 1].map((x) =>
        createFrameBufferBundle(gl, width / x, height / x)
    )
    // const debugPass = createFullscreenRenderPass(
    //     gl,
    //     createRenderPassQuadShader(gl)
    // )
    // const debug = (step: FrameBufferBundle) => {
    //     gl.viewport(0, 0, width, height)
    //     debugPass([step.texture], null)
    // }

    return () => {
        // Stage 1: render geometry to multisample renderbuffers
        gl.bindFramebuffer(gl.FRAMEBUFFER, geometryMultiSampleBuffer)
        renderGeometry()
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // Stage 2: copy anti-aliased geometry to geometry texture
        blit(
            gl,
            geometryMultiSampleBuffer,
            geometryFBBundle.frameBuffer,
            width,
            height
        )

        // Stage 3: Downsample and blur
        drawDownSampleBlur(geometryFBBundle, downsampleBlur[0])
        drawDownSampleBlur(downsampleBlur[0], downsampleBlur[1])
        drawDownSampleBlur(downsampleBlur[1], downsampleBlur[2])
        drawDownSampleBlur(downsampleBlur[2], downsampleBlur[3])
        drawDownSampleBlur(downsampleBlur[3], downsampleBlur[4])
        drawDownSampleBlur(downsampleBlur[4], downsampleBlur[5])

        // Stage 4: upsample and recombine
        drawUpSampleAdd(downsampleBlur[5], downsampleBlur[4], upsampleBlur[0])
        drawUpSampleAdd(upsampleBlur[0], downsampleBlur[3], upsampleBlur[1])
        drawUpSampleAdd(upsampleBlur[1], downsampleBlur[2], upsampleBlur[2])
        drawUpSampleAdd(upsampleBlur[2], downsampleBlur[1], upsampleBlur[3])
        drawUpSampleAdd(upsampleBlur[3], downsampleBlur[0], upsampleBlur[4])
        drawUpSampleAdd(upsampleBlur[4], geometryFBBundle, upsampleBlur[5])

        // Stage 5: Tone map (and gamma correct, if necessary)
        drawToneMap(upsampleBlur[5], null)
        // debug(downsampleBlur[5])
    }
}
export async function createRenderFunc(
    world: World,
    player: number
): Promise<() => void> {
    const { gl } = world.render
    gl.disable(gl.CULL_FACE)

    const bulletRenderPass = createBulletRenderer(world, gl)
    const drawEntities = createEntityRenderer(gl, world, player)
    const particleRenderPass = createParticleRenderer(gl, world)

    const Debug_LineRenderer = createDebugRenderer(gl)

    const renderGeometry = () => {
        const { gl } = world.render
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.viewport(0, 0, world.screen.width, world.screen.height)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.disable(gl.DEPTH_TEST)

        drawEntities()
        bulletRenderPass()
        particleRenderPass()
    }

    const bloomPass = createBloomPass(gl, world, renderGeometry)

    return () => {
        // renderGeometry()
        bloomPass()
        Debug_LineRenderer(
            world.render.cameraPos,
            vec2.fromValues(
                1.0 / MaxView,
                world.screen.width / world.screen.height / MaxView
            )
        )
    }
}
