const BulletThickness = 1
onmessage = (e: MessageEvent) => {
    const bulletPositions: Float32Array = e.data[0]
    const bulletVelocities: Float32Array = e.data[1]
    const bulletNormals: Float32Array = e.data[2]
    const bulletLengths: Float32Array = e.data[3]
    const Bullet_AABB: Float32Array = e.data[4]
    const Bullet_Polygon: Float32Array = e.data[5]
    let numBullets: number = e.data[6]

    const playerPos: number[] = e.data[7]
    const dt: number = e.data[8]

    for (let i = 0; i < numBullets; ++i) {
        bulletPositions[i * 2] += bulletVelocities[i * 2] * dt
        bulletPositions[i * 2 + 1] += bulletVelocities[i * 2 + 1] * dt
        if (
            Math.abs(bulletPositions[i * 2] - playerPos[0]) > 700 ||
            Math.abs(bulletPositions[i * 2 + 1] - playerPos[1]) > 700
        ) {
            bulletPositions[i * 2] = bulletPositions[(numBullets - 1) * 2]
            bulletPositions[i * 2 + 1] =
                bulletPositions[(numBullets - 1) * 2 + 1]
            bulletVelocities[i * 2] = bulletVelocities[(numBullets - 1) * 2]
            bulletVelocities[i * 2 + 1] =
                bulletVelocities[(numBullets - 1) * 2 + 1]
            bulletNormals[i * 2] = bulletNormals[(numBullets - 1) * 2]
            bulletNormals[i * 2 + 1] = bulletNormals[(numBullets - 1) * 2 + 1]
            bulletLengths[i] = bulletLengths[numBullets - 1]
            numBullets--
            i--
            continue
        }
        const bulletDirX = bulletNormals[i * 2 + 1]
        const bulletDirY = -bulletNormals[i * 2]
        Bullet_Polygon[i * 8] =
            bulletPositions[i * 2] + bulletNormals[i * 2] * BulletThickness
        Bullet_Polygon[i * 8 + 1] =
            bulletPositions[i * 2 + 1] +
            bulletNormals[i * 2 + 1] * BulletThickness
        Bullet_Polygon[i * 8 + 2] =
            bulletPositions[i * 2] - bulletNormals[i * 2] * BulletThickness
        Bullet_Polygon[i * 8 + 3] =
            bulletPositions[i * 2 + 1] -
            bulletNormals[i * 2 + 1] * BulletThickness
        Bullet_Polygon[i * 8 + 4] =
            bulletPositions[i * 2] -
            bulletDirX * bulletLengths[i] -
            bulletNormals[i * 2] * BulletThickness
        Bullet_Polygon[i * 8 + 5] =
            bulletPositions[i * 2 + 1] -
            bulletDirY * bulletLengths[i] -
            bulletNormals[i * 2 + 1] * BulletThickness
        Bullet_Polygon[i * 8 + 6] =
            bulletPositions[i * 2] -
            bulletDirX * bulletLengths[i] +
            bulletNormals[i * 2] * BulletThickness
        Bullet_Polygon[i * 8 + 7] =
            bulletPositions[i * 2 + 1] -
            bulletDirY * bulletLengths[i] +
            bulletNormals[i * 2 + 1] * BulletThickness

        Bullet_AABB[i * 4] = Math.min(
            Bullet_Polygon[i * 8],
            Bullet_Polygon[i * 8 + 2],
            Bullet_Polygon[i * 8 + 4],
            Bullet_Polygon[i * 8 + 6]
        )
        Bullet_AABB[i * 4 + 1] = Math.min(
            Bullet_Polygon[i * 8 + 1],
            Bullet_Polygon[i * 8 + 3],
            Bullet_Polygon[i * 8 + 5],
            Bullet_Polygon[i * 8 + 7]
        )
        Bullet_AABB[i * 4 + 2] = Math.max(
            Bullet_Polygon[i * 8],
            Bullet_Polygon[i * 8 + 2],
            Bullet_Polygon[i * 8 + 4],
            Bullet_Polygon[i * 8 + 6]
        )
        Bullet_AABB[i * 4 + 3] = Math.max(
            Bullet_Polygon[i * 8 + 1],
            Bullet_Polygon[i * 8 + 3],
            Bullet_Polygon[i * 8 + 5],
            Bullet_Polygon[i * 8 + 7]
        )
    }
    self.postMessage(
        [
            bulletPositions.buffer,
            bulletVelocities.buffer,
            bulletNormals.buffer,
            bulletLengths.buffer,
            Bullet_AABB.buffer,
            Bullet_Polygon.buffer,
            numBullets,
        ],
        // @ts-expect-error
        [
            bulletPositions.buffer,
            bulletVelocities.buffer,
            bulletNormals.buffer,
            bulletLengths.buffer,
            Bullet_AABB.buffer,
            Bullet_Polygon.buffer,
        ]
    )
}
