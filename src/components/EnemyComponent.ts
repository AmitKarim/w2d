import { addComponent, addEntity, ComponentType } from 'bitecs'
import { vec2 } from 'gl-matrix'
import { EnemyType, World } from '../World'

export type DiamondSquareComponent = ComponentType<{
    spawn_time: 'f32'
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
    const Enemy = world.components.Enemy
    addComponent(world, Enemy, entityID)

    addComponent(world, world.components.Health, entityID)
    world.components.Health.health[entityID] = params.health

    const e1 = addEntity(world)
    const e2 = addEntity(world)
    const e3 = addEntity(world)
    const e4 = addEntity(world)

    Enemy.shapes[entityID][0] = e1
    Enemy.shapes[entityID][1] = e2
    Enemy.shapes[entityID][2] = e3
    Enemy.shapes[entityID][3] = e4
    Enemy.num_shapes[entityID] = 4
    Enemy.spawn_time[entityID] = world.time.elapsed
    Enemy.enemy_type[entityID] = EnemyType.DiamondSquare

    const Diamond = world.components.Shapes.Diamond
    const Parent = world.components.Parent
    addComponent(world, Diamond, e1)
    addComponent(world, Diamond, e2)
    addComponent(world, Diamond, e3)
    addComponent(world, Diamond, e4)

    addComponent(world, Parent, e1)
    addComponent(world, Parent, e2)
    addComponent(world, Parent, e3)
    addComponent(world, Parent, e4)
    Parent.parent[e1] = entityID
    Parent.parent[e2] = entityID
    Parent.parent[e3] = entityID
    Parent.parent[e4] = entityID

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
