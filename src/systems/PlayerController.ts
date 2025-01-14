import { createDampingCoefficient, criticalSpring2D } from '../engine/Springs'
import { MaxView, World } from '../World'

export type PlayerData = {
    mouseX: number
    mouseY: number
}

export function createPlayerWorldData(): PlayerData {
    return { mouseX: 0, mouseY: 0 }
}

export function createPlayerController(
    world: World,
    player: number,
    canvas: HTMLCanvasElement
) {
    canvas.addEventListener(
        'mousemove',
        (e: MouseEvent) => {
            const halfWidth = world.screen.width / 2
            const halfHeight = world.screen.height / 2
            world.player.mouseX = ((e.x - halfWidth) * MaxView) / halfWidth
            world.player.mouseY =
                ((halfHeight - e.y) *
                    (world.screen.height / world.screen.width) *
                    MaxView) /
                halfHeight
            console.log(
                `x (orig): ${e.x} y(orig): ${e.y} x: ${world.player.mouseX} y: ${world.player.mouseY}`
            )
        },
        false
    )

    const playerDampingCoefficient = createDampingCoefficient(400)
    let playerVelocity: [number, number] = [0, 0]
    let playerPosition: [number, number] = [0, 0]
    return () => {
        criticalSpring2D(
            playerPosition,
            playerVelocity,
            [world.player.mouseX, world.player.mouseY],
            playerDampingCoefficient,
            world.time.delta
        )
        world.components.Position.xpos[player] = playerPosition[0]
        world.components.Position.ypos[player] = playerPosition[1]
    }
}
