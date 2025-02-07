import { vec3 } from 'gl-matrix'

/**
 * Converts an RGB color to HSB.
 * @param rgb - The RGB color as a vec3.
 * @returns The HSB color as a vec3.
 */
export function rgbToHsb(rgb: vec3): vec3 {
    const r = rgb[0]
    const g = rgb[1]
    const b = rgb[2]

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    let s = 0
    const v = max

    if (max !== 0) {
        s = delta / max
    }

    if (delta !== 0) {
        if (max === r) {
            h = (g - b) / delta + (g < b ? 6 : 0)
        } else if (max === g) {
            h = (b - r) / delta + 2
        } else {
            h = (r - g) / delta + 4
        }
        h /= 6
    }

    return vec3.fromValues(h, s, v)
}

/**
 * Converts an HSB color to RGB.
 * @param hsb - The HSB color as a vec3.
 * @returns The RGB color as a vec3.
 */
export function hsbToRgb(hsb: vec3): vec3 {
    const h = hsb[0]
    const s = hsb[1]
    const v = hsb[2]

    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    let r = 0
    let g = 0
    let b = 0

    switch (i % 6) {
        case 0:
            r = v
            g = t
            b = p
            break
        case 1:
            r = q
            g = v
            b = p
            break
        case 2:
            r = p
            g = v
            b = t
            break
        case 3:
            r = p
            g = q
            b = v
            break
        case 4:
            r = t
            g = p
            b = v
            break
        case 5:
            r = v
            g = p
            b = q
            break
    }

    return vec3.fromValues(r, g, b)
}

/**
 * Performs a hue shift using the golden ratio.
 * @param hsb - The HSB color as a vec3.
 * @param shiftAmount - The amount to shift the hue by, based on the golden ratio.
 * @returns The hue-shifted HSB color as a vec3.
 */
export function hueShift(hsb: vec3, shiftAmount: number): vec3 {
    const phi = 1.61803398875 // Golden ratio
    let h = hsb[0]
    h = (h + shiftAmount * phi) % 1.0 // Apply hue shift and wrap around
    return vec3.fromValues(h, hsb[1], hsb[2])
}
