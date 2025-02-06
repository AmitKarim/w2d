import { defineQuery, enterQuery, exitQuery } from 'bitecs'
import { EnemyType, World } from '../World'
import { mat3, vec2 } from 'gl-matrix'

const createDiamondSquareUpdate = (world: World, player: number) => {
    const DIAMOND_SQUARE_OFFSET = 12
    const Position = world.components.Position
    const Enemy = world.components.Enemy

    const offset = vec2.create()
    const childPos = vec2.create()
    const rotation = mat3.create()

    const toPlayer = vec2.create()
    return (e: number) => {
        mat3.fromRotation(rotation, Position.angle[e])
        const e1 = Enemy.shapes[e][0]
        const e2 = Enemy.shapes[e][1]
        const e3 = Enemy.shapes[e][2]
        const e4 = Enemy.shapes[e][3]
        Position.angle[e] =
            (Position.angle[e] + Math.PI * world.time.delta) % (2 * Math.PI)

        toPlayer[0] = Position.pos[player][0] - Position.pos[e][0]
        toPlayer[1] = Position.pos[player][1] - Position.pos[e][1]
        vec2.normalize(toPlayer, toPlayer)
        vec2.scale(toPlayer, toPlayer, world.time.delta * 50)
        Position.pos[e][0] += toPlayer[0]
        Position.pos[e][1] += toPlayer[1]

        const updatePosition = (entity: number) => {
            vec2.transformMat3(offset, offset, rotation)
            vec2.add(childPos, Position.pos[e], offset)

            Position.angle[entity] = Position.angle[e]
            Position.pos[entity][0] = childPos[0]
            Position.pos[entity][1] = childPos[1]
        }
        const phase =
            DIAMOND_SQUARE_OFFSET *
            0.25 *
            Math.sin(world.time.elapsed - Enemy.spawn_time[e])
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

export function createEnemyShapeUpdater(
    world: World,
    player: number
): () => void {
    const Enemy = world.components.Enemy
    const enemyQuery = defineQuery([Enemy])
    const enemiesAdded = enterQuery(enemyQuery)
    const enemiesRemoved = exitQuery(enemyQuery)

    const behaviorUpdates = new Map<number, () => void>()

    const EnemyMap: Record<EnemyType, (e: number) => void> = {
        1: createDiamondSquareUpdate(world, player),
    }

    return () => {
        // Stop updating entities we removed
        enemiesRemoved(world).map((x) => behaviorUpdates.delete(x))

        // Factory behavior for new entities
        enemiesAdded(world).forEach((x) => {
            if (x != 1) {
                throw Error('Invalid')
            }
            const update = EnemyMap[1]
            behaviorUpdates.set(x, () => update(x))
        })

        // Update existing behaviors
        for (const b of behaviorUpdates.values()) {
            b()
        }
    }
}
