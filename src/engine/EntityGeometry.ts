import ComputeNormals from 'polyline-normals'

export const EntityTypes = ['player', 'diamond', 'crossed_diamond'] as const
export type EntityType = (typeof EntityTypes)[number]

type Point = [number, number]
type Line = {
    points: Point[]
    closed: boolean
}

const entities: Record<EntityType, Line[]> = {
    player: [
        {
            points: [
                [0, -0.5],
                [-0.4, 0],
                [0, 0.5],
                [0.4, 0],
            ],
            closed: true,
        },
        {
            points: [
                [0, -0.5],
                [0, 0.5],
            ],
            closed: false,
        },
        {
            points: [
                [-0.4, 0],
                [0.4, 0],
            ],
            closed: false,
        },
    ],
    diamond: [
        {
            points: [
                [0, -0.5],
                [-0.4, 0],
                [0, 0.5],
                [0.4, 0],
            ],
            closed: true,
        },
    ],
    crossed_diamond: [
        {
            points: [
                [0, -0.3],
                [-0.5, 0],
                [-0.5, 0.5],
                [-0.4, 0.1],
                [-0.2, 0],
                [0, 0.2],
                [0.2, 0],
                [0.4, 0.1],
                [0.5, 0.5],
                [0.5, 0],
            ],
            closed: true,
        },
    ],
}

type EntityGeometry = {
    points: Point[]
    normals: Point[]
    indices: number[]
    miters: number[]
}

function negate(p: Point): Point {
    return [-p[0], -p[1]]
}

function computeGeometry(entries: Line[]): EntityGeometry {
    const points: Point[] = []
    const normals: Point[] = []
    const miters: number[] = []
    const indices: number[] = []
    for (const line of entries) {
        const normalData = ComputeNormals(line.points, line.closed)
        const curPointOffset = points.length
        for (let i = 0; i < line.points.length; ++i) {
            points.push(line.points[i])
            normals.push(normalData[i][0])
            miters.push(normalData[i][1])

            points.push(line.points[i])
            normals.push(negate(normalData[i][0]))
            miters.push(normalData[i][1])

            if (i < line.points.length - 1 || line.closed) {
                const i1 = curPointOffset + i * 2
                const i2 = curPointOffset + i * 2 + 1
                const i3 =
                    curPointOffset + ((i * 2 + 2) % (2 * line.points.length))
                const i4 =
                    curPointOffset + ((i * 2 + 3) % (2 * line.points.length))
                indices.push(i1, i2, i4, i4, i3, i1)
            }
        }
    }
    return {
        points,
        normals,
        miters,
        indices,
    }
}

export const EntityGeometry: Record<EntityType, EntityGeometry> = {
    player: computeGeometry(entities['player']),
    diamond: computeGeometry(entities['diamond']),
    crossed_diamond: computeGeometry(entities['crossed_diamond']),
}
