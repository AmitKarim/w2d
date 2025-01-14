export function unreachable(_x: never, msg = '') {
    throw new Error(`Unreachable code: ${msg}`)
}
