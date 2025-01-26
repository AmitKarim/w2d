import { vec2 } from 'gl-matrix'
// import ComputeNormals from 'polyline-normals'

type Point = [number, number]
export type Line = {
    points: Point[]
    closed: false
}
export type Polygon = {
    points: Point[]
    closed: true
}
export type LineGeometry = {
    points: Float32Array
    indices: Uint16Array
}

function midpoint(p1: Point, p2: Point): Point {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
}

const tesselateStraightLine = (() => {
    const v0 = vec2.create()
    const n0 = vec2.create()
    const a = vec2.create()
    const b = vec2.create()
    const c = vec2.create()
    const d = vec2.create()
    const aPrime = vec2.create()
    const bPrime = vec2.create()
    const cPrime = vec2.create()
    const dPrime = vec2.create()
    const tmp = vec2.create()
    const tesselate = (
        line: [vec2, vec2],
        thickness: number,
        feather: number
    ): LineGeometry => {
        vec2.subtract(v0, line[1], line[0])
        vec2.normalize(v0, v0)
        n0[0] = v0[1]
        n0[1] = -v0[0]

        const halfThickness = thickness / 2.0

        vec2.scale(a, n0, halfThickness)
        vec2.add(a, line[0], a)

        vec2.scale(b, n0, halfThickness)
        vec2.subtract(b, line[0], b)

        vec2.scale(c, n0, halfThickness)
        vec2.subtract(c, line[1], c)

        vec2.scale(d, n0, halfThickness)
        vec2.add(d, line[1], d)

        vec2.scale(tmp, n0, halfThickness + feather)
        vec2.add(tmp, line[0], tmp)
        vec2.scale(aPrime, v0, feather)
        vec2.subtract(aPrime, tmp, aPrime)

        vec2.scale(tmp, n0, halfThickness + feather)
        vec2.subtract(tmp, line[0], tmp)
        vec2.scale(bPrime, v0, feather)
        vec2.subtract(bPrime, tmp, bPrime)

        vec2.scale(tmp, n0, halfThickness + feather)
        vec2.subtract(tmp, line[1], tmp)
        vec2.scale(cPrime, v0, feather)
        vec2.add(cPrime, tmp, cPrime)

        vec2.scale(tmp, n0, feather + halfThickness)
        vec2.add(tmp, line[1], tmp)
        vec2.scale(dPrime, v0, feather)
        vec2.add(dPrime, tmp, dPrime)

        const points = new Float32Array([
            a[0],
            a[1],
            1.0,
            b[0],
            b[1],
            1.0,
            c[0],
            c[1],
            1.0,
            d[0],
            d[1],
            1.0,
            aPrime[0],
            aPrime[1],
            0.0,
            bPrime[0],
            bPrime[1],
            0.0,
            cPrime[0],
            cPrime[1],
            0.0,
            dPrime[0],
            dPrime[1],
            0.0,
        ])
        const indices = new Uint16Array([
            0, 3, 1, 1, 3, 2, 0, 4, 7, 7, 0, 3, 3, 7, 6, 6, 2, 3, 6, 5, 1, 1, 2,
            6, 5, 4, 1, 1, 4, 0,
        ])
        return { points, indices }
    }
    return tesselate
})()

type Anchor = {
    points: [vec2, vec2, vec2]
    start_cap: boolean
    end_cap: boolean
}

const tesselateAnchor = (() => {
    const v0 = vec2.create()
    const v1 = vec2.create()
    const n0 = vec2.create()
    const n1 = vec2.create()

    const aPrime = vec2.create()
    const bPrime = vec2.create()
    const cPrime = vec2.create()
    const dPrime = vec2.create()
    const ePrime = vec2.create()
    const fPrime = vec2.create()
    const gPrime = vec2.create()
    const a = vec2.create()
    const b = vec2.create()
    const c = vec2.create()
    const d = vec2.create()
    const e = vec2.create()
    const f = vec2.create()
    const g = vec2.create()

    const tmp = vec2.create()
    const tmp1 = vec2.create()

    const arc = [vec2.create(), vec2.create(), vec2.create(), vec2.create()]
    const featherArc = [
        vec2.create(),
        vec2.create(),
        vec2.create(),
        vec2.create(),
    ]
    let arcSize = 0

    const intersect = (out: vec2, a: vec2, aDir: vec2, b: vec2, bDir: vec2) => {
        const denominator = bDir[0] * aDir[1] - aDir[0] * bDir[1]

        if (denominator === 0) {
            throw Error('Parallel lines')
        }

        const t1 =
            (bDir[0] * (b[1] - a[1]) - bDir[1] * (b[0] - a[0])) / denominator

        // Check if intersection point is on both rays
        out[0] = a[0] + t1 * aDir[0]
        out[1] = a[1] + t1 * aDir[1]
    }

    const tesselate = (
        anchor: Anchor,
        thickness: number,
        feather: number
    ): LineGeometry => {
        const p0 = anchor.points[0]
        const p1 = anchor.points[1]
        const p2 = anchor.points[2]

        vec2.subtract(v0, p1, p0)
        vec2.subtract(v1, p2, p1)
        vec2.normalize(v0, v0)
        vec2.normalize(v1, v1)

        n0[0] = v0[1]
        n0[1] = -v0[0]
        n1[0] = v1[1]
        n1[1] = -v1[0]

        const halfThickness = thickness / 2.0

        // a
        vec2.scale(a, n0, halfThickness)
        vec2.add(a, p0, a)

        // b
        vec2.scale(b, n0, halfThickness)
        vec2.subtract(b, p0, b)

        // d
        vec2.scale(d, n0, halfThickness)
        vec2.subtract(d, p1, d)

        // e
        vec2.scale(e, n1, halfThickness)
        vec2.subtract(e, p1, e)

        // f
        vec2.scale(f, n1, halfThickness)
        vec2.subtract(f, p2, f)

        // g
        vec2.scale(g, n1, halfThickness)
        vec2.add(g, p2, g)

        // c
        intersect(c, a, v0, g, v1)

        // a'
        vec2.scale(aPrime, n0, halfThickness + feather)
        if (anchor.start_cap) {
            vec2.scale(tmp, v0, feather)
            vec2.subtract(aPrime, aPrime, tmp)
        }
        vec2.add(aPrime, p0, aPrime)

        // b'
        vec2.scale(bPrime, n0, halfThickness + feather)
        if (anchor.start_cap) {
            vec2.subtract(bPrime, bPrime, tmp)
        }
        vec2.subtract(bPrime, p0, bPrime)

        // d'
        vec2.subtract(tmp, d, c)
        vec2.normalize(tmp, tmp)
        intersect(dPrime, bPrime, v0, d, tmp)

        // f'
        vec2.scale(fPrime, n1, halfThickness + feather)
        if (anchor.end_cap) {
            vec2.scale(tmp, v1, feather)
            vec2.subtract(fPrime, fPrime, tmp)
        }
        vec2.subtract(fPrime, p2, fPrime)

        // g'
        vec2.scale(gPrime, n1, halfThickness + feather)
        if (anchor.end_cap) {
            vec2.subtract(gPrime, gPrime, tmp)
        }
        vec2.add(gPrime, p2, gPrime)

        // e'
        vec2.subtract(tmp, e, c)
        vec2.normalize(tmp, tmp)
        intersect(ePrime, fPrime, v1, e, tmp)

        // c'
        intersect(cPrime, aPrime, v0, gPrime, v1)

        // const arc: vec2[] = []
        vec2.subtract(tmp, d, c)
        vec2.subtract(tmp1, e, c)
        vec2.normalize(tmp, tmp)
        vec2.normalize(tmp1, tmp1)
        const theta = Math.acos(vec2.dot(tmp, tmp1))
        vec2.subtract(tmp, d, c)
        vec2.subtract(tmp1, dPrime, c)

        if (theta == 0) {
            arcSize = 0
        } else if (theta <= 0.174533) {
            arcSize = 1
        } else if (theta <= 0.349066) {
            arcSize = 2
        } else if (theta <= 0.523599) {
            arcSize = 3
        } else {
            arcSize = 4
        }
        if (arcSize > 0) {
            const tesselationAngle = -theta / (arcSize + 1)
            for (let i = 0; i < arcSize; ++i) {
                const angle = tesselationAngle * (i + 1)
                const cosTheta = Math.cos(angle)
                const sinTheta = Math.sin(angle)
                arc[i][0] = cosTheta * tmp[0] - sinTheta * tmp[1]
                arc[i][1] = sinTheta * tmp[0] + cosTheta * tmp[1]
                vec2.add(arc[i], c, arc[i])

                featherArc[i][0] = cosTheta * tmp1[0] - sinTheta * tmp1[1]
                featherArc[i][1] = sinTheta * tmp1[0] + cosTheta * tmp1[1]
                vec2.add(featherArc[i], c, featherArc[i])
            }
        }

        const points = new Float32Array(42 + arcSize * 6)
        points[0] = a[0]
        points[1] = a[1]
        points[2] = 1.0
        points[3] = b[0]
        points[4] = b[1]
        points[5] = 1.0
        points[6] = c[0]
        points[7] = c[1]
        points[8] = 1.0
        points[9] = d[0]
        points[10] = d[1]
        points[11] = 1.0
        points[12] = e[0]
        points[13] = e[1]
        points[14] = 1.0
        points[15] = f[0]
        points[16] = f[1]
        points[17] = 1.0
        points[18] = g[0]
        points[19] = g[1]
        points[20] = 1.0
        points[21] = aPrime[0]
        points[22] = aPrime[1]
        points[23] = 0.0
        points[24] = bPrime[0]
        points[25] = bPrime[1]
        points[26] = 0.0
        points[27] = cPrime[0]
        points[28] = cPrime[1]
        points[29] = 0.0
        points[30] = dPrime[0]
        points[31] = dPrime[1]
        points[32] = 0.0
        points[33] = ePrime[0]
        points[34] = ePrime[1]
        points[35] = 0.0
        points[36] = fPrime[0]
        points[37] = fPrime[1]
        points[38] = 0.0
        points[39] = gPrime[0]
        points[40] = gPrime[1]
        points[41] = 0.0

        for (let i = 0; i < arcSize; ++i) {
            points[42 + i * 3] = arc[i][0]
            points[42 + i * 3 + 1] = arc[i][1]
            points[42 + i * 3 + 2] = 1.0
            points[42 + arcSize * 3 + i * 3] = featherArc[i][0]
            points[42 + arcSize * 3 + i * 3 + 1] = featherArc[i][1]
            points[42 + arcSize * 3 + i * 3 + 2] = 0.0
        }

        const indices = new Uint16Array(
            48 + (arcSize == 0 ? 0 : (arcSize + 1) * 9)
        )
        indices[0] = 0
        indices[1] = 2
        indices[2] = 3 // acd
        indices[3] = 3
        indices[4] = 1
        indices[5] = 0 // dba
        indices[6] = 2
        indices[7] = 6
        indices[8] = 5 // cgf
        indices[9] = 5
        indices[10] = 4
        indices[11] = 2 // fec
        indices[12] = 8
        indices[13] = 7
        indices[14] = 1 // b'a'b
        indices[15] = 1
        indices[16] = 7
        indices[17] = 0 // ba'a
        indices[18] = 8
        indices[19] = 1
        indices[20] = 3 //b'bd
        indices[21] = 3
        indices[22] = 10
        indices[23] = 8 // dd'b'
        indices[24] = 7
        indices[25] = 9
        indices[26] = 2 // a'c'c
        indices[27] = 2
        indices[28] = 0
        indices[29] = 7 // caa'
        indices[30] = 9
        indices[31] = 13
        indices[32] = 6 // c'g'g
        indices[33] = 6
        indices[34] = 2
        indices[35] = 9 // gcc'
        indices[36] = 13
        indices[37] = 12
        indices[38] = 6 // g'f'g
        indices[39] = 6
        indices[40] = 12
        indices[41] = 5 // gf'f
        indices[42] = 5
        indices[43] = 12
        indices[44] = 11 // ff'e'
        indices[45] = 11
        indices[46] = 4
        indices[47] = 5 // e'ef

        let idx = 48
        if (arcSize > 0) {
            indices[idx++] = 3
            indices[idx++] = 2
            indices[idx++] = 14
            indices[idx++] = 3
            indices[idx++] = 14
            indices[idx++] = 14 + arcSize
            indices[idx++] = 14 + arcSize
            indices[idx++] = 10
            indices[idx++] = 3
            for (let i = 0; i < arcSize - 1; ++i) {
                indices[idx++] = 14 + i
                indices[idx++] = 2
                indices[idx++] = 14 + i + 1
                indices[idx++] = 14 + arcSize + i
                indices[idx++] = 14 + i
                indices[idx++] = 14 + i + 1
                indices[idx++] = 14 + i + 1
                indices[idx++] = 14 + arcSize + i + 1
                indices[idx++] = 14 + arcSize + i
            }
            indices[idx++] = 14 + arcSize - 1
            indices[idx++] = 2
            indices[idx++] = 4
            indices[idx++] = 14 + arcSize - 1
            indices[idx++] = 4
            indices[idx++] = 11
            indices[idx++] = 11
            indices[idx++] = 14 + arcSize + arcSize - 1
            indices[idx++] = 14 + arcSize - 1
        }

        return { points, indices }
    }
    return tesselate
})()

export function tesselateLines(
    lines: (Line | Polygon)[],
    thickness: number,
    feather: number
): LineGeometry {
    const polyLines = lines.filter((x) => x.points.length > 2)
    const straightLines = lines.filter((x) => x.points.length == 2)
    const allAnchors: Anchor[] = polyLines
        .map((line): Anchor[] => {
            const midpoints: Point[] = []
            for (let i = 0; i < line.points.length - 1; ++i) {
                midpoints.push(midpoint(line.points[i], line.points[i + 1]))
            }
            if (!line.closed) {
                midpoints[0] = line.points[0]
                midpoints[midpoints.length - 1] =
                    line.points[line.points.length - 1]
            } else {
                midpoints.push(
                    midpoint(
                        line.points[line.points.length - 1],
                        line.points[0]
                    )
                )
            }
            const anchors: Anchor[] = []

            for (let i = 0; i < line.points.length - 1; ++i) {
                anchors.push({
                    points: [
                        midpoints[i],
                        line.points[i + 1],
                        midpoints[i + 1],
                    ],
                    start_cap: i == 0 && !line.closed,
                    end_cap: i == line.points.length - 2 && !line.closed,
                })
            }
            if (line.closed) {
                anchors.push({
                    points: [
                        midpoints[midpoints.length - 1],
                        line.points[0],
                        midpoints[0],
                    ],
                    start_cap: false,
                    end_cap: false,
                })
            }
            return anchors
        })
        .flat()
    const lineEntries = allAnchors
        .map((x) => tesselateAnchor(x, thickness, feather))
        .concat(
            straightLines.map((x) =>
                tesselateStraightLine(
                    x.points as [vec2, vec2],
                    thickness,
                    feather
                )
            )
        )
    const numVertices = lineEntries.reduce(
        (prev, cur) => (prev += cur.points.length),
        0
    )
    const numIndices = lineEntries.reduce(
        (prev, cur) => (prev += cur.indices.length),
        0
    )
    const finalGeometry = new Float32Array(numVertices)
    const finalIndices = new Uint16Array(numIndices)
    let curVertexIndex = 0
    let curIndexIndex = 0
    for (const line of lineEntries) {
        finalGeometry.set(line.points, curVertexIndex)
        finalIndices.set(
            line.indices.map((x) => (x += curVertexIndex / 3)),
            curIndexIndex
        )
        curVertexIndex += line.points.length
        curIndexIndex += line.indices.length
    }
    return {
        points: finalGeometry,
        indices: finalIndices,
    }
}
