export type SpriteComponent = {
    sprite: string[]
    width: number[]
    height: number[]
}

export function createSpriteComponent(): SpriteComponent {
    return { sprite: [], width: [], height: [] }
}
