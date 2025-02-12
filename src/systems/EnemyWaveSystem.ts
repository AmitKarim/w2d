import { spawnDiamondSquare } from '../components/EnemyComponent'
import { World } from '../World'

type Wave = {
    enemies: number[]
    dead: number[]
}

let activeWave: Wave | null = null
let waveLevel = 0

export function getWaveLevel() {
    return waveLevel
}

export function getWaveComplete() {
    return !activeWave || activeWave.dead.length == activeWave.enemies.length
}

export function hasActiveWave() {
    return activeWave != null
}

export function createNextWave(level: number, world: World) {
    if (!getWaveComplete()) {
        throw new Error('Active wave')
    }
    waveLevel = level
    const enemies = []
    for (let i = 0; i < level; ++i) {
        enemies.push(
            spawnDiamondSquare(
                {
                    pos: [Math.random() * 200, Math.random() * 200],
                    angle: Math.random() * Math.PI * 2,
                    health: 100,
                    color: [150, 32, 110],
                },
                world
            )
        )
    }
    activeWave = {
        enemies,
        dead: [],
    }
}

export function createEnemyWaveSystem(world: World) {
    return () => {
        if (!activeWave) {
            return
        }
        activeWave.dead = [
            ...activeWave.enemies
                .map((x) => world.components.Health.health[x])
                .filter((x) => x <= 0),
        ]
        if (activeWave.dead.length == activeWave.enemies.length) {
            activeWave = null
        }
    }
}
