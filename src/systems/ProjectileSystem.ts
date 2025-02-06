import { World } from '../World'
// @ts-expect-error
import Worker from './projectiles/BulletUpdate.worker'

export const BulletThickness = 1
export const MAX_BULLETS = 1000
export let Bullet_Pos = new Float32Array(MAX_BULLETS * 2)
export let Bullet_Vel = new Float32Array(MAX_BULLETS * 2)
export let Bullet_Normal = new Float32Array(MAX_BULLETS * 2)
export let Bullet_Length = new Float32Array(MAX_BULLETS)
export let Bullet_AABB = new Float32Array(MAX_BULLETS * 4)
export let Bullet_Polygon = new Float32Array(MAX_BULLETS * 8)

export let NumBullets = 0

function addBullet(x: number, y: number, v_x: number, v_y: number) {
    if (NumBullets == MAX_BULLETS) {
        return
    }
    let insertIdx = NumBullets++
    Bullet_Pos[insertIdx * 2] = x
    Bullet_Pos[insertIdx * 2 + 1] = y
    Bullet_Vel[insertIdx * 2] = v_x
    Bullet_Vel[insertIdx * 2 + 1] = v_y
    const v_length = Math.max(0.001, Math.sqrt(v_y * v_y + v_x * v_x))
    Bullet_Normal[insertIdx * 2] = v_y / v_length
    Bullet_Normal[insertIdx * 2 + 1] = -v_x / v_length
    Bullet_Length[insertIdx] = 3
}

export function createBulletProcessor(
    world: World,
    player: number
): () => Promise<void> {
    let lastFireTime: number = world.time.elapsed
    let elapsedTime: number = 0
    let bulletWorker = Worker()
    return () => {
        if (world.player.controls.weapon_type != 'bullets') {
            return Promise.resolve()
        }
        const playerPos = world.components.Position.pos[player]
        elapsedTime = world.time.elapsed - lastFireTime
        if (elapsedTime >= world.player.controls.firing_rate) {
            lastFireTime = world.time.elapsed
            let v_x =
                -Math.sin(world.components.Position.angle[player]) *
                world.player.controls.projectile_speed
            let v_y =
                Math.cos(world.components.Position.angle[player]) *
                world.player.controls.projectile_speed
            addBullet(
                world.components.Position.pos[player][0],
                world.components.Position.pos[player][1],
                v_x,
                v_y
            )
        }

        const dt = world.time.delta

        return new Promise<void>((resolve) => {
            bulletWorker.onmessage = (e: MessageEvent) => {
                const data = e.data
                Bullet_Pos = new Float32Array(data[0])
                Bullet_Vel = new Float32Array(data[1])
                Bullet_Normal = new Float32Array(data[2])
                Bullet_Length = new Float32Array(data[3])
                Bullet_AABB = new Float32Array(data[4])
                Bullet_Polygon = new Float32Array(data[5])
                NumBullets = data[6]
                resolve()
            }
            bulletWorker.postMessage(
                [
                    Bullet_Pos,
                    Bullet_Vel,
                    Bullet_Normal,
                    Bullet_Length,
                    Bullet_AABB,
                    Bullet_Polygon,
                    NumBullets,
                    playerPos,
                    dt,
                ],
                [
                    Bullet_Pos.buffer,
                    Bullet_Vel.buffer,
                    Bullet_Normal.buffer,
                    Bullet_Length.buffer,
                    Bullet_AABB.buffer,
                    Bullet_Polygon.buffer,
                ]
            )
        })
    }
}
