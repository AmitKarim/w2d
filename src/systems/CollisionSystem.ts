import { World } from '../World'
import { ShapeGeometry } from '../engine/Shapes'
import { vec2 } from 'gl-matrix'
import { Debug_DrawLine } from '../engine/Debug_LineDrawingSystem'

// const MAX_POINTS = 50000
// const Geometry = new Float32Array(MAX_POINTS)
// const Entities = new Uint32Array(1000)

const debugDrawShape = (() => {
    return (pos: vec2, angle: number, shape: vec2[]) => {
        const a = vec2.create()
        const b = vec2.create()
        for (let i = 0; i < shape.length; ++i) {
            vec2.rotate(a, shape[i], [0, 0], angle)
            vec2.rotate(b, shape[(i + 1) % shape.length], [0, 0], angle)
            vec2.add(a, a, pos)
            vec2.add(b, b, pos)
            Debug_DrawLine(a, b, [0.0, 1.0, 0.0, 1.0])
        }
    }
})()

function debugDrawShapes(pos: vec2, angle: number, shapes: vec2[][]) {
    shapes.map((x) => debugDrawShape(pos, angle, x))
}

export function createCollisionSystem(world: World, player: number) {
    // const shapeQueries: Record<EnemyType, Query<World>> = {
    //     crossed_diamond: defineQuery([world.components.Shapes.CrossedDiamond]),
    //     diamond: defineQuery([world.components.Shapes.Diamond]),
    // }

    return () => {
        debugDrawShapes(
            world.components.Position.pos[player],
            world.components.Position.angle[player],
            ShapeGeometry['player'].collision
        )
        debugDrawShape(
            [0, 0],
            0,
            [[0, 0], [0, 100], [100, 100], [100, 0]]
        )
    }
}
