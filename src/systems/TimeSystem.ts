import { World } from '../World'

export function updateTime(world: World) {
    const { time } = world
    const now = performance.now()
    time.delta = now - time.then
    time.elapsed += time.delta
    time.then = now
}
