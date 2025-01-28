export type Shader<Uniform extends string, Attribute extends string> = {
    program: WebGLProgram
    uniforms: Record<Uniform, WebGLUniformLocation>
    attributes: Record<Attribute, number>
}

export function createShader<
    Uniforms extends string,
    Attributes extends string,
>(
    gl: WebGL2RenderingContext,
    vsSrc: string,
    fsSrc: string,
    uniforms: Uniforms[],
    attributes: Attributes[]
): Shader<Uniforms, Attributes> {
    const program = gl.createProgram()
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) {
        throw Error('Failed to create vertex shader')
    }
    gl.shaderSource(vertexShader, vsSrc)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        // there was an error
        console.error(gl.getShaderInfoLog(vertexShader))
    }
    gl.attachShader(program, vertexShader)

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) {
        throw Error('Failed to create fragment shader')
    }
    gl.shaderSource(fragmentShader, fsSrc)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        // there was an error
        console.error(gl.getShaderInfoLog(fragmentShader))
    }
    gl.attachShader(program, fragmentShader)

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader))
        console.log(gl.getShaderInfoLog(fragmentShader))
        throw Error('failed to create shader')
    }
    const uniformLocations: Record<Uniforms, WebGLUniformLocation> = {} as any
    for (const uniform of uniforms) {
        const location = gl.getUniformLocation(program, uniform)
        if (!location) {
            console.error(`Failed to find location of uniform ${uniform}`)
            continue
        }
        uniformLocations[uniform] = location
    }
    const attributeLocations: Record<Attributes, number> = {} as any
    for (const attribute of attributes) {
        const location = gl.getAttribLocation(program, attribute)
        if (location < 0) {
            console.error(`Failed to find location of attribute ${attribute}`)
            continue
        }
        attributeLocations[attribute] = location
    }
    const shader: Shader<Uniforms, Attributes> = {
        program,
        uniforms: uniformLocations,
        attributes: attributeLocations,
    }
    return shader
}
