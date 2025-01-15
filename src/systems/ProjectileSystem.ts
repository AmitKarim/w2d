import { World } from '../World'

export const MAX_BULLETS = 1000
export const Bullet_Pos = new Float32Array(MAX_BULLETS * 2)
export const Bullet_Vel = new Float32Array(MAX_BULLETS * 2)
export const Bullet_Normal = new Float32Array(MAX_BULLETS * 2)
export const Bullet_Length = new Float32Array(MAX_BULLETS)

let numBullets = 0

export function getBulletCount(): number {
    return numBullets
}

function addBullet(x: number, y: number, v_x: number, v_y: number) {
    if (numBullets == MAX_BULLETS) {
        return
    }
    let insertIdx = numBullets++
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
): () => void {
    let lastFireTime: number = world.time.elapsed
    let elapsedTime: number = 0
    return () => {
        if (world.player.controls.weapon_type != 'bullets') {
            return
        }
        elapsedTime = world.time.elapsed - lastFireTime
        if (elapsedTime >= world.player.controls.firing_rate) {
            lastFireTime = world.time.elapsed
            let v_x =
                Math.sin(world.components.Position.angle[player]) *
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
        for (let i = 0; i < numBullets; ++i) {
            Bullet_Pos[i * 2] += Bullet_Vel[i * 2] * dt
            Bullet_Pos[i * 2 + 1] += Bullet_Vel[i * 2 + 1] * dt
        }
    }
}
