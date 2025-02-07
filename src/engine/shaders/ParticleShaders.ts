import { createShader } from '../Shader'

const ParticleCreationVertexShaderSrc = `#version 300 es

uniform vec2 position;
uniform float time;
uniform float lifetime;
uniform sampler2D randomTexture;
uniform vec3 color;

in float aUnique;
out vec2 vPos1;
out vec2 vVel1;
out vec4 vColor1;
out float vLifetime1;
out float vAge1;
out vec2 vPos2;
out vec2 vVel2;
out vec4 vColor2;
out float vLifetime2;
out float vAge2;

float getRandomValue(vec2 uv) {
    return texture(randomTexture, uv).r;
}

void main() {
    vec2 uv = vec2(aUnique, fract(time)); // Use unique ID and time as texture coordinates
    float angle = getRandomValue(uv) * 3.14195 * 2.0;
    float particleLife = lifetime * (0.8 + (getRandomValue(uv + vec2(0.1, 0.0)) - 0.5) * 0.2);
    float speed = 300.0 + getRandomValue(uv + vec2(0.2, 0.0)) * 200.0;
    vVel1 = vec2(sin(angle), cos(angle)) * speed;
    vVel2 = vVel1 * (getRandomValue(uv + vec2(0.4, 0.7)) * 0.3 + 0.7);
    vPos1 = position;
    vPos2 = position;

    vColor1 = vec4(color.rgb, 1.0);
    vColor2 = vec4(color.rgb, 1.0);

    vLifetime1 = particleLife;
    vLifetime2 = particleLife;
    vAge1 = 0.0;
    vAge2 = 0.0;
}
`

const ParticleUpdateVertexShaderSrc = `#version 300 es
uniform float deltaTime;
uniform vec2 cameraPos;
uniform vec2 screenSize;

in vec2 aPos;
in vec2 aVel;
in vec4 aColor;
in float aLifetime;
in float aAge;

out vec2 vPos;
out vec2 vVel;
out vec4 vColor;
out float vLifetime;
out float vAge;
void main() {
    vColor = aColor;
    vLifetime = aLifetime;
    vVel = aVel * (1.0 - 2.0*deltaTime);
    vAge = aAge + deltaTime;
    vColor.rgb *= 1.0 - smoothstep(0.8, 1.0, vAge / vLifetime);
    if (vAge > vLifetime) {
        vPos = vec2(0,0);
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        vPos = aPos + aVel * deltaTime;
        gl_Position = vec4(((vPos - cameraPos) * screenSize).xy, 0.0, 1.0); 
    }
}
`

const ParticleUpdateFragmentSrc = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fragColor;
void main()
{
    fragColor = vColor;
}`

const TransformFeedbackFragmentSrc = `#version 300 es
precision mediump float;
void main()
{
}`

export function createExplosionSpawner(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        ParticleCreationVertexShaderSrc,
        TransformFeedbackFragmentSrc,
        ['position', 'time', 'lifetime', 'randomTexture', 'color'],
        ['aUnique'],
        [
            'vPos1',
            'vVel1',
            'vColor1',
            'vLifetime1',
            'vAge1',
            'vPos2',
            'vVel2',
            'vColor2',
            'vLifetime2',
            'vAge2',
        ]
    )
}

export function createParticleUpdateShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        ParticleUpdateVertexShaderSrc,
        ParticleUpdateFragmentSrc,
        ['deltaTime', 'cameraPos', 'screenSize'],
        ['aPos', 'aVel', 'aColor', 'aLifetime', 'aAge'],
        ['vPos', 'vVel', 'vColor', 'vLifetime', 'vAge']
    )
}
