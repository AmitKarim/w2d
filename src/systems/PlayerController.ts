import { defineQuery } from 'bitecs'
import { createDampingCoefficient, criticalSpring2D } from '../engine/Springs'
import { MaxView, World } from '../World'
import { vec2 } from 'gl-matrix'

export type PlayerData = {
    mouseX: number
    mouseY: number
    controls: {
        weapon_type: 'bullets'
        firing_rate: number
        projectile_speed: number
    }
}

export function createPlayerWorldData(): PlayerData {
    return {
        mouseX: 0,
        mouseY: 0,
        controls: {
            weapon_type: 'bullets',
            firing_rate: 0.3,
            projectile_speed: 100.0,
        },
    }
}

export function createPlayerController(
    world: World,
    player: number,
    canvas: HTMLCanvasElement
) {
    canvas.addEventListener('mousemove', (event) => {
        const canvasRect = canvas.getBoundingClientRect()
        const scaleX = (MaxView * 2) / canvasRect.width
        const MaxY = (world.screen.height / world.screen.width) * MaxView
        const scaleY = (MaxY * 2) / canvasRect.height

        world.player.mouseX =
            (event.clientX - canvasRect.left) * scaleX - MaxView
        world.player.mouseY =
            (canvas.height - event.clientY + canvasRect.top) * scaleY - MaxY
    })

    const playerDampingCoefficient = createDampingCoefficient(0.4)
    let playerVelocity: [number, number] = [0, 0]
    let playerPosition: [number, number] = [0, 0]

    let enemyQuery = defineQuery([world.components.Enemy])
    const Position = world.components.Position
    return () => {
        const enemies = enemyQuery(world)

        criticalSpring2D(
            playerPosition,
            playerVelocity,
            [
                world.render.cameraPos[0] + world.player.mouseX,
                world.render.cameraPos[1] + world.player.mouseY,
            ],
            playerDampingCoefficient,
            world.time.delta
        )

        let nearest = Number.POSITIVE_INFINITY
        let sqDist = 0
        let closestEnemy: number = -1
        for (const enemy of enemies) {
            sqDist =
                (Position.pos[enemy][0] - playerPosition[0]) *
                    (Position.pos[enemy][0] - playerPosition[0]) +
                (Position.pos[enemy][1] - playerPosition[1]) *
                    (Position.pos[enemy][1] - playerPosition[1])
            if (sqDist < nearest) {
                closestEnemy = enemy
            }
        }
        if (closestEnemy >= 0) {
            const dir = vec2.fromValues(
                Position.pos[closestEnemy][0] - playerPosition[0],
                Position.pos[closestEnemy][1] - playerPosition[1]
            )
            vec2.normalize(dir, dir)
            Position.angle[player] = Math.acos(dir[1])
            if (dir[0] > 0) {
                Position.angle[player] = -Position.angle[player]
            }
        }
        Position.pos[player][0] = playerPosition[0]
        Position.pos[player][1] = playerPosition[1]
    }
}
