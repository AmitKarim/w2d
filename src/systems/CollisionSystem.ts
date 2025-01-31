import { World } from '../World'
import { ShapeGeometry } from '../engine/Shapes'
import { vec2, vec4 } from 'gl-matrix'
import { Debug_DrawLine } from '../engine/Debug_LineDrawingSystem'

// const MAX_POINTS = 50000
// const Geometry = new Float32Array(MAX_POINTS)
// const Entities = new Uint32Array(1000)

const debugDrawShape = (() => {
    // const blue = vec4.fromValues(0,0,1,1)
    // const red = vec4.fromValues(1,0,0,1)
    return (pos: vec2, angle: number, shape: vec2[]) => {
        const a = vec2.create()
        const b = vec2.create()
        for (let i = 0; i < shape.length; ++i) {
            vec2.rotate(a, shape[i], [0, 0], angle)
            vec2.rotate(b, shape[(i + 1) % shape.length], [0, 0], angle)
            vec2.add(a, a, pos)
            vec2.add(b, b, pos)
            let color = vec4.fromValues(0, 1, 0, 1)
            // if (i === 0) {
            //     color = red
            // } else if (i === shape.length-1) {
            //     color = blue
            // }
            Debug_DrawLine(a, b, color)
        }
        // for (let i = 4; i < shape.length; ++i) {
        //     for (let j = 2; j < shape.length - 3; ++j) {
        //         const p0 = i
        //         const p1 = (i + 2 + j) % shape.length
        //         vec2.rotate(a, shape[p0], [0,0], angle)
        //         vec2.rotate(b, shape[p1], [0, 0], angle)
        //         vec2.add(a, a, pos)
        //         vec2.add(b, b, pos)
        //         const [visible, badIdx] = isVisible(shape, p0, p1)
        //         const inside = isInside(shape, p0, p1)
        //         // Debug_DrawLine(a, b, (inside && visible) ? blue : red)
        //         // Debug_DrawLine(a, b, visible ? blue : red)
        //         // if (!visible) {
        //         //     const t1 = vec2.rotate(vec2.create(), shape[badIdx], [0,0], angle)
        //         //     const t2 = vec2.rotate(vec2.create(), shape[(badIdx + 1) % shape.length], [0,0], angle)
        //         //     vec2.add(t1, t1, pos)
        //         //     vec2.add(t2, t2, pos)
        //         //     Debug_DrawLine(a, b, visible ? blue : red)
        //         //     Debug_DrawLine(t1, t2, red)
        //         // }
        //         // }
        //         // }
        //         break
        //     }
        //     break
        // }
    }
})()

function debugDrawShapes(pos: vec2, angle: number, shapes: vec2[][]) {
    // debugDrawShape(pos, angle, shapes[2])
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
    }
}
