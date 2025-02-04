import { World } from '../World'
import { ShapeGeometry, Shapes, ShapeType } from '../engine/Shapes'
import { vec2 } from 'gl-matrix'
import { defineQuery, Query } from 'bitecs'
import { checkCollision } from '../engine/collision/SATCollision'
import { createQuadTree } from '../engine/collision/QuadTree'
import { Bullet_AABB, Bullet_Polygon, NumBullets } from './ProjectileSystem'

// const MAX_POINTS = 50000
// const Geometry = new Float32Array(MAX_POINTS)
// const Entities = new Uint32Array(1000)

// function checkAABBCollision(a: [vec2, vec2], b: Float32Array, idx: number) {
//     const [min, max] = a
//     const [minX, minY, maxX, maxY] = b.subarray(idx * 4, idx * 4 + 4)
//     return min[0] < maxX && max[0] > minX && min[1] < maxY && max[1] > minY
// }

// const debugDrawShape = (() => {
//     return (pos: vec2, angle: number, shape: vec2[]) => {
//         const a = vec2.create()
//         const b = vec2.create()
//         for (let i = 0; i < shape.length; ++i) {
//             vec2.rotate(a, shape[i], [0, 0], angle)
//             vec2.rotate(b, shape[(i + 1) % shape.length], [0, 0], angle)
//             vec2.add(a, a, pos)
//             vec2.add(b, b, pos)
//             let color = vec4.fromValues(0, 1, 0, 1)
//             Debug_DrawLine(a, b, color)
//         }
//     }
// })()

// function debugDrawShapes(pos: vec2, angle: number, shapes: vec2[][]) {
//     shapes.map((x) => debugDrawShape(pos, angle, x))
// }

// function computeAABB(shape: vec2[][]): [vec2, vec2] {
//     const min = vec2.create()
//     const max = vec2.create()
//     for (const part of shape) {
//         for (const point of part) {
//             vec2.min(min, min, point)
//             vec2.max(max, max, point)
//         }
//     }
//     return [min, max]
// }

export function createCollisionSystem(world: World, _player: number) {
    const shapeQueries: Record<Exclude<ShapeType, 'player'>, Query<World>> = {
        crossed_diamond: defineQuery([world.components.Shapes.CrossedDiamond]),
        diamond: defineQuery([world.components.Shapes.Diamond]),
    }

    const a = vec2.create()
    const zero = [0, 0] as const
    const transformShape = (pos: vec2, angle: number, shape: vec2[][]) => {
        return shape.map((x) =>
            x.map((x) =>
                vec2.clone(vec2.add(a, vec2.rotate(a, x, zero, angle), pos))
            )
        )
    }
    const computeAABB = (shape: vec2[][]) => {
        let maxX = Number.NEGATIVE_INFINITY
        let minX = Number.POSITIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        for (const subShape of shape) {
            for (const point of subShape) {
                maxX = Math.max(maxX, point[0])
                minX = Math.min(minX, point[0])
                maxY = Math.max(maxY, point[1])
                minY = Math.min(minY, point[1])
            }
        }
        return [minX, minY, maxX - minX, maxY - minY]
    }

    return () => {
        // const playerShape: vec2[][] = transformShape(
        //     world.components.Position.pos[player],
        //     world.components.Position.angle[player],
        //     ShapeGeometry['player'].collision
        // )
        const bulletTree = createQuadTree<number>(
            vec2.fromValues(-1000, -1000),
            vec2.fromValues(2000, 2000),
            10,
            10
        )
        for (let i = 0; i < NumBullets; ++i) {
            bulletTree.insert(
                i,
                Bullet_AABB[i * 4],
                Bullet_AABB[i * 4 + 1],
                Bullet_AABB[i * 4 + 2],
                Bullet_AABB[i * 4 + 3]
            )
        }
        bulletTree.debugDraw()

        // const playerAABB = computeAABB(playerShape)

        const enemyShapes: vec2[][][] = []

        for (const shape of Shapes) {
            if (shape === 'player') {
                continue
            }
            const entities = shapeQueries[shape](world)
            for (const e of entities) {
                enemyShapes.push(
                    transformShape(
                        world.components.Position.pos[e],
                        world.components.Position.angle[e],
                        ShapeGeometry[shape].collision
                    )
                )
            }
        }

        for (const enemy of enemyShapes) {
            const aabb = computeAABB(enemy)
            const bullets = bulletTree.query(aabb[0], aabb[1], aabb[2], aabb[3])
            const bulletShape = [
                vec2.create(),
                vec2.create(),
                vec2.create(),
                vec2.create(),
            ]
            for (const enemyPart of enemy) {
                for (const bullet of bullets) {
                    bulletShape[0][0] = Bullet_Polygon[bullet * 4]
                    bulletShape[0][1] = Bullet_Polygon[bullet * 4 + 1]
                    bulletShape[1][0] = Bullet_Polygon[bullet * 4 + 2]
                    bulletShape[1][1] = Bullet_Polygon[bullet * 4 + 3]
                    bulletShape[2][0] = Bullet_Polygon[bullet * 4 + 4]
                    bulletShape[2][1] = Bullet_Polygon[bullet * 4 + 5]
                    bulletShape[3][0] = Bullet_Polygon[bullet * 4 + 6]
                    bulletShape[3][1] = Bullet_Polygon[bullet * 4 + 7]
                    if (checkCollision(bulletShape, enemyPart)) {
                        console.log('collision')
                    }
                }
            }
        }
    }
}
