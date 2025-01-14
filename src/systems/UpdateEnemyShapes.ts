import { defineQuery } from 'bitecs'
import { World } from '../World'
import { mat3, vec2 } from 'gl-matrix'

const DIAMOND_SQUARE_OFFSET = 6

export function createEnemyShapeUpdater(
    world: World,
    _player: number
): () => void {
    const diamondSquareQuery = defineQuery([
        world.components.Enemies.DiamondSquare,
    ])
    const DiamondSquare = world.components.Enemies.DiamondSquare

    const Position = world.components.Position

    const offset = vec2.create()
    const childPos = vec2.create()
    const rotation = mat3.create()

    const updateDiamondSquares = () => {
        const enemies = diamondSquareQuery(world)
        for (const e of enemies) {
            mat3.fromRotation(rotation, Position.angle[e])
            const e1 = DiamondSquare.shapes[e][0]
            const e2 = DiamondSquare.shapes[e][1]
            const e3 = DiamondSquare.shapes[e][2]
            const e4 = DiamondSquare.shapes[e][3]
            Position.angle[e] =
                (Position.angle[e] + Math.PI * 0.0001 * world.time.delta) %
                (2 * Math.PI)

            const updatePosition = (entity: number) => {
                vec2.transformMat3(offset, offset, rotation)
                vec2.add(childPos, Position.pos[e], offset)

                Position.angle[entity] = Position.angle[e]
                Position.pos[entity][0] = childPos[0]
                Position.pos[entity][1] = childPos[1]
            }
            const phase =
                0.8 *
                Math.sin(
                    (world.time.elapsed - DiamondSquare.spawn_time[e]) * 0.001
                )
            offset[0] = 0
            offset[1] = DIAMOND_SQUARE_OFFSET + phase
            updatePosition(e1)
            offset[0] = DIAMOND_SQUARE_OFFSET + phase
            offset[1] = 0
            updatePosition(e2)
            offset[0] = 0
            offset[1] = -DIAMOND_SQUARE_OFFSET - phase
            updatePosition(e3)
            offset[0] = -DIAMOND_SQUARE_OFFSET - phase
            offset[1] = 0
            updatePosition(e4)
        }
    }

    return () => {
        updateDiamondSquares()
    }
}
