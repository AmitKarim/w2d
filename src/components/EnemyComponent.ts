import { addComponent, addEntity, ComponentType } from 'bitecs'
import { vec2 } from 'gl-matrix'
import { World } from '../World'

export type DiamondSquareComponent = ComponentType<{
    spawn_time: 'f32'
    health: 'f32'
    shapes: ['eid', 4]
}>

export type SpawnDiamondSquareParams = {
    pos: vec2
    angle: number
    color: number[]
    health: number
}
export function spawnDiamondSquare(
    params: SpawnDiamondSquareParams,
    world: World
): number {
    const entityID = addEntity(world)
    const DiamondSquare = world.components.Enemies.DiamondSquare
    addComponent(world, DiamondSquare, entityID)

    const e1 = addEntity(world)
    const e2 = addEntity(world)
    const e3 = addEntity(world)
    const e4 = addEntity(world)

    DiamondSquare.shapes[entityID][0] = e1
    DiamondSquare.shapes[entityID][1] = e2
    DiamondSquare.shapes[entityID][2] = e3
    DiamondSquare.shapes[entityID][3] = e4
    DiamondSquare.health[entityID] = params.health
    DiamondSquare.spawn_time[entityID] = world.time.elapsed

    addComponent(world, world.components.Shapes.Diamond, e1)
    addComponent(world, world.components.Shapes.Diamond, e2)
    addComponent(world, world.components.Shapes.Diamond, e3)
    addComponent(world, world.components.Shapes.Diamond, e4)

    addComponent(world, world.components.Color, e1)
    addComponent(world, world.components.Color, e2)
    addComponent(world, world.components.Color, e3)
    addComponent(world, world.components.Color, e4)
    world.components.Color.color[e1][0] = params.color[0]
    world.components.Color.color[e1][1] = params.color[1]
    world.components.Color.color[e1][2] = params.color[2]
    world.components.Color.color[e2][0] = params.color[0]
    world.components.Color.color[e2][1] = params.color[1]
    world.components.Color.color[e2][2] = params.color[2]
    world.components.Color.color[e3][0] = params.color[0]
    world.components.Color.color[e3][1] = params.color[1]
    world.components.Color.color[e3][2] = params.color[2]
    world.components.Color.color[e4][0] = params.color[0]
    world.components.Color.color[e4][1] = params.color[1]
    world.components.Color.color[e4][2] = params.color[2]

    return entityID
}
