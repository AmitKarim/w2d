import { createDampingCoefficient, criticalSpring2D } from '../engine/Springs'
import { World } from '../World'

export function createCameraSystem(world: World, player: number) {
    const springCoefficient = createDampingCoefficient(2.0)
    const cameraPos: [number, number] = [0, 0]
    const cameraVel: [number, number] = [0, 0]
    return () => {
        const playerPos = world.components.Position.pos[player]
        criticalSpring2D(
            cameraPos,
            cameraVel,
            [playerPos[0], playerPos[1]],
            springCoefficient,
            world.time.delta
        )
        world.render.cameraPos[0] = cameraPos[0]
        world.render.cameraPos[1] = cameraPos[1]
    }
}
