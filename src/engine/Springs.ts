export function createDampingCoefficient(halflife: number) {
    const eps = 1e-5
    return (4.0 * 0.69314718056) / (halflife + eps)
}

function fast_negexp(x: number) {
    return 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)
}

export function criticalSpring(
    current: [number, number],
    goal: number,
    dampingCoefficient: number,
    dt: number
): void {
    const y = dampingCoefficient / 2.0
    const j0 = current[0] - goal
    const j1 = current[1] + j0 * y
    const eydt = fast_negexp(y * dt)

    current[0] = eydt * (j0 + j1 * dt) + goal
    current[1] = eydt * (current[1] - j1 * y * dt)
}

export function criticalSpring2D(
    x: [number, number],
    v: [number, number],
    goal: [number, number],
    dampingCoefficient: number,
    dt: number
): void {
    const xValues: [number, number] = [x[0], v[0]]
    const yValues: [number, number] = [x[1], v[1]]
    criticalSpring(xValues, goal[0], dampingCoefficient, dt)
    criticalSpring(yValues, goal[1], dampingCoefficient, dt)
    x[0] = xValues[0]
    x[1] = yValues[0]
    v[0] = xValues[1]
    v[1] = yValues[1]
}
