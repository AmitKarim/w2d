import { vec2 } from 'gl-matrix'
import { decomposePolygon } from './PolygonDecomposition'
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

type PartialCollisionResult = {
    outer: vec2[]
    inner: vec2[]
}

type PartialTesselationResult = {
    visual: {
        points: Float32Array
        indices: Uint16Array
    }
    collision: PartialCollisionResult
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
    ): PartialTesselationResult => {
        vec2.subtract(v0, line[1], line[0])
        vec2.normalize(v0, v0)
        n0[0] = v0[1]
        n0[1] = -v0[0]

        vec2.scale(tmp, n0, thickness / 2)
        // a
        vec2.subtract(a, line[0], tmp)
        // b
        vec2.add(b, line[0], tmp)
        // c
        vec2.add(c, line[1], tmp)
        // d
        vec2.subtract(d, line[1], tmp)

        vec2.scale(tmp, n0, thickness / 2 + feather)
        // a'
        vec2.subtract(aPrime, line[0], tmp)
        // b'
        vec2.add(bPrime, line[0], tmp)
        // c'
        vec2.add(cPrime, line[1], tmp)
        // d'
        vec2.subtract(dPrime, line[1], tmp)

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
            0, 1, 2, 2, 3, 0, 4, 0, 3, 3, 7, 4, 1, 5, 6, 6, 2, 1,
        ])
        return {
            visual: { points, indices },
            collision: {
                outer: [vec2.clone(a), vec2.clone(d)],
                inner: [vec2.clone(c), vec2.clone(b)],
            },
        }
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
    ): PartialTesselationResult => {
        const p0 = anchor.points[0]
        const p1 = anchor.points[1]
        const p2 = anchor.points[2]

        vec2.subtract(v0, p1, p0)
        vec2.subtract(v1, p2, p1)
        vec2.normalize(v0, v0)
        vec2.normalize(v1, v1)

        const isCCW = v0[0] * v1[1] - v0[1] * v1[0] >= 0

        n0[0] = v0[1]
        n0[1] = -v0[0]
        n1[0] = v1[1]
        n1[1] = -v1[0]

        if (isCCW) {
            n0[0] = -n0[0]
            n0[1] = -n0[1]
            n1[0] = -n1[0]
            n1[1] = -n1[1]
        }

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
        vec2.add(aPrime, p0, aPrime)

        // b'
        vec2.scale(bPrime, n0, halfThickness + feather)
        vec2.subtract(bPrime, p0, bPrime)

        // d'
        vec2.scale(dPrime, n0, halfThickness + feather)
        vec2.subtract(dPrime, p1, dPrime)

        // f'
        vec2.scale(fPrime, n1, halfThickness + feather)
        vec2.subtract(fPrime, p2, fPrime)

        // g'
        vec2.scale(gPrime, n1, halfThickness + feather)
        vec2.add(gPrime, p2, gPrime)

        // e'
        vec2.scale(ePrime, n1, halfThickness + feather)
        vec2.subtract(ePrime, p1, ePrime)

        // c'
        intersect(cPrime, aPrime, v0, gPrime, v1)

        // const arc: vec2[] = []
        vec2.subtract(tmp, d, p1)
        vec2.subtract(tmp1, e, p1)
        vec2.normalize(tmp, tmp)
        vec2.normalize(tmp1, tmp1)
        let theta = Math.acos(vec2.dot(tmp, tmp1))
        if (isCCW) {
            theta = -theta
        }
        vec2.subtract(tmp, d, p1)
        vec2.subtract(tmp1, dPrime, p1)

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
                vec2.add(arc[i], p1, arc[i])

                featherArc[i][0] = cosTheta * tmp1[0] - sinTheta * tmp1[1]
                featherArc[i][1] = sinTheta * tmp1[0] + cosTheta * tmp1[1]
                vec2.add(featherArc[i], p1, featherArc[i])
            }
        }

        const points = new Float32Array(45 + arcSize * 6)
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
        points[21] = p1[0]
        points[22] = p1[1]
        points[23] = 1.0
        points[24] = aPrime[0]
        points[25] = aPrime[1]
        points[26] = 0.0
        points[27] = bPrime[0]
        points[28] = bPrime[1]
        points[29] = 0.0
        points[30] = cPrime[0]
        points[31] = cPrime[1]
        points[32] = 0.0
        points[33] = dPrime[0]
        points[34] = dPrime[1]
        points[35] = 0.0
        points[36] = ePrime[0]
        points[37] = ePrime[1]
        points[38] = 0.0
        points[39] = fPrime[0]
        points[40] = fPrime[1]
        points[41] = 0.0
        points[42] = gPrime[0]
        points[43] = gPrime[1]
        points[44] = 0.0

        for (let i = 0; i < arcSize; ++i) {
            points[45 + i * 3] = arc[i][0]
            points[45 + i * 3 + 1] = arc[i][1]
            points[45 + i * 3 + 2] = 1.0
            points[45 + arcSize * 3 + i * 3] = featherArc[i][0]
            points[45 + arcSize * 3 + i * 3 + 1] = featherArc[i][1]
            points[45 + arcSize * 3 + i * 3 + 2] = 0.0
        }

        const indices = new Uint16Array(
            42 + (arcSize == 0 ? 0 : (arcSize + 1) * 9)
        )
        indices.set([
            1,
            0,
            2, // bac
            2,
            7,
            1, // chb
            1,
            7,
            3, // bhd
            6,
            5,
            2, // gfc
            2,
            5,
            7, // cfh
            7,
            5,
            4, // hfe
            9,
            1,
            3, // b'bd
            3,
            11,
            9, // dd'b'
            0,
            8,
            10, // aa'c'
            10,
            2,
            0, // c'ca
            14,
            6,
            2, // g'gc
            2,
            10,
            14, // cc'g'
            5,
            13,
            12, // ff'e'
            12,
            4,
            5, // e'ef
        ])
        let idx = 42
        if (arcSize > 0) {
            indices.set(
                [
                    3,
                    7,
                    15, // dha0
                    3,
                    15,
                    15 + arcSize, // da0a0'
                    15 + arcSize,
                    11,
                    3, // a0'd'd
                ],
                idx
            )
            idx += 9
            for (let i = 0; i < arcSize - 1; ++i) {
                indices.set(
                    [
                        15 + i,
                        7,
                        15 + i + 1, // aihai++
                        15 + arcSize + i,
                        15 + i,
                        15 + i + 1, // ai'aiai++
                        15 + i + 1,
                        15 + arcSize + i + 1,
                        15 + arcSize + i, // ai++ai++'ai'
                    ],
                    idx
                )
                idx += 9
            }
            indices.set(
                [
                    15 + arcSize - 1,
                    7,
                    4, // aihe
                    15 + arcSize - 1,
                    4,
                    12, // aiee'
                    12,
                    15 + arcSize + arcSize - 1,
                    15 + arcSize - 1, // e'ai'ai
                ],
                idx
            )
        }

        const outer = [
            vec2.clone(b),
            vec2.clone(d),
            vec2.clone(e),
            vec2.clone(f),
        ]
        const inner = [vec2.clone(g), vec2.clone(c), vec2.clone(a)]
        return {
            visual: { points, indices },
            collision: {
                outer: isCCW ? inner.reverse() : outer,
                inner: isCCW ? outer.reverse() : inner,
            },
        }
    }
    return tesselate
})()

export function tesselateLines(
    lines: (Line | Polygon)[],
    thickness: number,
    feather: number
): { visual: LineGeometry; collision: vec2[][] } {
    const tesselatedLines = lines.map(
        (line): { visual: LineGeometry[]; collision: vec2[][] } => {
            if (!line.closed && line.points.length == 2) {
                const result = tesselateStraightLine(
                    line.points as [vec2, vec2],
                    thickness,
                    feather
                )
                return {
                    visual: [
                        {
                            points: result.visual.points,
                            indices: result.visual.indices,
                        },
                    ],
                    collision: [
                        [...result.collision.outer, ...result.collision.inner],
                    ],
                }
            }

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
            for (let i = 0; i < midpoints.length - 1; ++i) {
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
            const anchorTesselation = anchors.map((x) =>
                tesselateAnchor(x, thickness, feather)
            )
            let collisionGeometry: vec2[]
            if (line.closed) {
                collisionGeometry = anchorTesselation
                    .map((x) => x.collision.outer)
                    .reduce((prev, cur) => [...prev, ...cur], [])
            } else {
                collisionGeometry = anchorTesselation
                    .map((x) => x.collision)
                    .reduce(
                        (
                            prev: [vec2[], vec2[]],
                            cur: PartialCollisionResult
                        ): [vec2[], vec2[]] => {
                            return [
                                [...prev[0], ...cur.outer],
                                [...cur.inner, ...prev[1]],
                            ]
                        },
                        [[] as vec2[], [] as vec2[]]
                    )
                    .reduce((prev, cur) => [...prev, ...cur], [])
            }
            const visualGeometry = anchorTesselation.map((x) => x.visual)
            return {
                visual: visualGeometry,
                collision: decomposePolygon(collisionGeometry),
            }
        }
    )
    const visuals = tesselatedLines.map((x) => x.visual).flat()
    const numVertices = visuals.reduce(
        (prev, cur) => (prev += cur.points.length),
        0
    )
    const numIndices = visuals.reduce(
        (prev, cur) => (prev += cur.indices.length),
        0
    )
    const finalGeometry = new Float32Array(numVertices)
    const finalIndices = new Uint16Array(numIndices)
    let curVertexIndex = 0
    let curIndexIndex = 0
    for (const line of visuals) {
        finalGeometry.set(line.points, curVertexIndex)
        finalIndices.set(
            line.indices.map((x) => (x += curVertexIndex / 3)),
            curIndexIndex
        )
        curVertexIndex += line.points.length
        curIndexIndex += line.indices.length
    }
    const finalCollision = tesselatedLines
        .map((x) => x.collision)
        .reduce((prev, cur) => [...prev, ...cur], [])
    return {
        visual: {
            points: finalGeometry,
            indices: finalIndices,
        },
        collision: finalCollision,
    }
}
