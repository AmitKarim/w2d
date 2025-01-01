import { World } from '../World'
import { defineQuery } from 'bitecs'

export function createPositionUpdateSystem(world: World) {
    const query = defineQuery([world.components.Position])
    return (world: World) => {
        const entities = query(world)
        const P = world.components.Position
        const dt = world.time.delta
        for (const id of entities) {
            P.xvel[id] += P.xacc[id] * dt
            P.yvel[id] += P.yacc[id] * dt
            P.xpos[id] += P.yvel[id] * dt
            P.ypos[id] += P.yvel[id] * dt
            P.angle[id] += P.angularVelocity[id] * dt
            P.xacc[id] = 0
            P.yacc[id] = 0
        }
    }
}
