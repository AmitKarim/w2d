import { addComponent } from 'bitecs'
import { World } from '../World'

export type PositionComponent = {
    xpos: number[]
    ypos: number[]
    xvel: number[]
    yvel: number[]
    xacc: number[]
    yacc: number[]
    angle: number[]
    angularVelocity: number[]
}

export function createPositionComponent(): PositionComponent {
    return {
        xpos: [],
        ypos: [],
        xvel: [],
        yvel: [],
        xacc: [],
        yacc: [],
        angle: [],
        angularVelocity: [],
    }
}

export function addPositionComponent(entityID: number, world: World) {
    const Position = world.components.Position
    addComponent(world, Position, entityID)
    Position.xacc[entityID] = 0
    Position.yacc[entityID] = 0
    Position.xvel[entityID] = 0
    Position.yvel[entityID] = 0
    Position.xpos[entityID] = 0
    Position.ypos[entityID] = 0
    Position.angle[entityID] = 0
    Position.angularVelocity[entityID] = 0
}
