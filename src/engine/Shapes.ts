import { Line, LineGeometry, Polygon, tesselateLines } from './EntityGeometry'

export const Shapes = ['player', 'diamond', 'crossed_diamond'] as const
export type ShapeType = (typeof Shapes)[number]
type Shape = (Polygon | Line)[]
const shapes: Record<ShapeType, Shape> = {
    crossed_diamond: [
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
    player: [
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

function scaleShape(shape: Shape, scale: number): Shape {
    return shape.map((x) => ({
        points: x.points.map((x) => [x[0] * scale, x[1] * scale]),
        closed: x.closed,
    }))
}

export const ShapeGeometry: Record<ShapeType, LineGeometry> = {
    player: tesselateLines(scaleShape(shapes['player'], 30), 2.0, 1.0),
    diamond: tesselateLines(scaleShape(shapes['diamond'], 50), 3.0, 1.0),
    crossed_diamond: tesselateLines(
        scaleShape(shapes['crossed_diamond'], 500),
        30,
        10.0
    ),
}
