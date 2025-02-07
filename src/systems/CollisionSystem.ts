import { World } from '../World'
import { ShapeGeometry, Shapes, ShapeType } from '../engine/Shapes'
import { vec2, vec4 } from 'gl-matrix'
import { defineQuery, Query } from 'bitecs'
import { checkCollision } from '../engine/collision/SATCollision'
import { createQuadTree } from '../engine/collision/QuadTree'
import {
    Bullet_AABB,
    Bullet_Polygon,
    Bullet_Pos,
    NumBullets,
    removeBullet,
} from './ProjectileSystem'
import { createNewParticleExplosion } from '../engine/rendering/ParticleRendering'
import { Debug_DrawLine } from '../engine/Debug_LineDrawingSystem'

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
        return [minX, minY, maxX, maxY]
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
            100
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

        const drawAABB = (aabb: number[], color: vec4) => {
            const v: [number, number][] = [
                [aabb[0], aabb[1]],
                [aabb[2], aabb[1]],
                [aabb[2], aabb[3]],
                [aabb[0], aabb[3]],
            ]
            Debug_DrawLine(v[0], v[1], color)
            Debug_DrawLine(v[1], v[2], color)
            Debug_DrawLine(v[2], v[3], color)
            Debug_DrawLine(v[3], v[0], color)
        }

        bulletTree.debugDraw(
            [
                world.render.cameraPos[0] + world.player.mouseX,
                world.render.cameraPos[1] + world.player.mouseY,
            ],
            (x: number) =>
                drawAABB(
                    [...Bullet_AABB.slice(x * 4, (x + 1) * 4)],
                    vec4.fromValues(0, 0, 1, 1)
                )
        )

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

        const debug_color = vec4.fromValues(1, 1, 0, 1)
        let bulletsToDelete = new Set<number>()

        for (const enemy of enemyShapes) {
            const aabb = computeAABB(enemy)
            drawAABB(aabb, debug_color)
            const bullets = bulletTree.query(
                aabb[0],
                aabb[1],
                aabb[2] - aabb[0],
                aabb[3] - aabb[1]
            )

            bullets.forEach((x) =>
                drawAABB(
                    [...Bullet_AABB.slice(x * 4, (x + 1) * 4)],
                    vec4.fromValues(1, 1, 1, 1)
                )
            )
            const bulletShape = [
                vec2.create(),
                vec2.create(),
                vec2.create(),
                vec2.create(),
            ]
            for (const enemyPart of enemy) {
                for (
                    let bulletIdx = 0;
                    bulletIdx < bullets.length;
                    ++bulletIdx
                ) {
                    const bullet = bullets[bulletIdx]
                    if (bulletsToDelete.has(bullet)) {
                        continue
                    }
                    bulletShape[0][0] = Bullet_Polygon[bullet * 8]
                    bulletShape[0][1] = Bullet_Polygon[bullet * 8 + 1]
                    bulletShape[1][0] = Bullet_Polygon[bullet * 8 + 2]
                    bulletShape[1][1] = Bullet_Polygon[bullet * 8 + 3]
                    bulletShape[2][0] = Bullet_Polygon[bullet * 8 + 4]
                    bulletShape[2][1] = Bullet_Polygon[bullet * 8 + 5]
                    bulletShape[3][0] = Bullet_Polygon[bullet * 8 + 6]
                    bulletShape[3][1] = Bullet_Polygon[bullet * 8 + 7]
                    if (checkCollision(bulletShape, enemyPart)) {
                        createNewParticleExplosion({
                            position: vec2.fromValues(
                                Bullet_Pos[bullet * 2],
                                Bullet_Pos[bullet * 2 + 1]
                            ),
                            size: 1,
                            lifeTime: 2.0,
                        })
                        bulletsToDelete.add(bullets[bulletIdx])
                    }
                }
            }
        }
        for (const bullet of bulletsToDelete.keys()) {
            removeBullet(bullet)
        }
    }
}
