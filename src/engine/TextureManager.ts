export type Texture = {
    u: [number, number]
    v: [number, number]
    bind: () => void
}

function loadImage(uri: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.addEventListener('load', () => {
            resolve(img)
        })
        img.src = uri
    })
}

export class TextureManager {
    _ctx: WebGL2RenderingContext
    _assetPath: string
    constructor(ctx: WebGL2RenderingContext, assetPath: string) {
        this._ctx = ctx
        this._assetPath = assetPath
    }
    createTexture(name: string): Promise<Texture> {
        const gl = this._ctx
        const fullURI = `${this._assetPath}/${name}`
        return loadImage(fullURI).then((img) => {
            const tex = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )

            return {
                bind: () => gl.bindTexture(gl.TEXTURE_2D, tex),
                u: [0, 1],
                v: [0, 1],
            }
        })
    }
}
