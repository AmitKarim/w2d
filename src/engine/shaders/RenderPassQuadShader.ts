import { createShader } from '../Shader'

const VertexShaderSrc = `#version 300 es

in vec2 aPos;
in vec2 aTexCoord;
out vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
    vTexCoord = aTexCoord;
}
`

const ThresholdShaderFragmentSrc = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
in vec2 vTexCoord;
out vec4 fragColor;
const float luminanceCutoff = 0.9;
void main() {
    fragColor = texture(sampler, vTexCoord);
    float luminance = dot(fragColor.rgb, vec3(0.30, 0.59, 0.11));
    fragColor = luminance > luminanceCutoff ? fragColor : vec4(0, 0, 0, 0);
    fragColor.a = 1.0;
}`

const FragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
in vec2 vTexCoord;
out vec4 fragColor;
void main() {
    fragColor = texture(sampler, vTexCoord);
}
`

const DownsampleBlurFragmentShaderSrc = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
uniform vec2 texelSize;
in vec2 vTexCoord;
out vec4 fragColor;
void main() {
    vec3 A = texture(sampler, vTexCoord + texelSize * vec2(-1.0,  1.0)).rgb;
    vec3 B = texture(sampler, vTexCoord + texelSize * vec2( 0.0,  1.0)).rgb;
    vec3 C = texture(sampler, vTexCoord + texelSize * vec2( 1.0,  1.0)).rgb;
    vec3 D = texture(sampler, vTexCoord + texelSize * vec2(-0.5,  0.5)).rgb;
    vec3 E = texture(sampler, vTexCoord + texelSize * vec2( 0.5,  0.5)).rgb;
    vec3 F = texture(sampler, vTexCoord + texelSize * vec2(-1.0,  0.0)).rgb;
    vec3 G = texture(sampler, vTexCoord                                ).rgb;
    vec3 H = texture(sampler, vTexCoord + texelSize * vec2( 1.0,  0.0)).rgb;
    vec3 I = texture(sampler, vTexCoord + texelSize * vec2(-0.5, -0.5)).rgb;
    vec3 J = texture(sampler, vTexCoord + texelSize * vec2( 0.5, -0.5)).rgb;
    vec3 K = texture(sampler, vTexCoord + texelSize * vec2(-1.0, -1.0)).rgb;
    vec3 L = texture(sampler, vTexCoord + texelSize * vec2( 0.0, -1.0)).rgb;
    vec3 M = texture(sampler, vTexCoord + texelSize * vec2( 1.0, -1.0)).rgb;

    /*  SAMPLES PATTERN
            -1   0   1
            + ----------
        1   |  A   B   C
            |    D   E
        0   |  F   G   H   ←  [0,0] = G
            |    I   J
        -1  |  K   L   M
    */

    // Corner samples
    vec3 quad_NW  = (A + B + F + G) * 0.25;  // average of ABGF
    vec3 quad_NE  = (B + C + G + H) * 0.25;  // average of BCGH
    vec3 quad_SW  = (F + G + K + L) * 0.25;  // average of FGLK
    vec3 quad_SE  = (G + H + L + M) * 0.25;  // average of GHML

    // Central sample
    vec3 quad_C  = (D + E + I + J) * .25;   // average of DEIJ


    vec3 sum = (A + C + K + M) * 0.25;
    // vec3 sum = 0.125 * (quad_NW + quad_NE + quad_SW + quad_SE)
    //             + 0.5   * quad_C;
    //             // .125 + .125 + .125 + .125 + .5 = 1.0
    //             // The combined sample weights sum to exactly 1.0, so no change in brightness

    fragColor = vec4(sum, 1.0);
}`

const UpSampleFragmentShaderSrc = `#version 300 es
#define BLOOM_BLENDMODE_ADD 0
precision mediump float;

uniform sampler2D smallerSampler;
uniform sampler2D largerSampler;
uniform vec2 texelSize;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
    /*  SAMPLES PATTERN
            -1   1
            + ------
        1   |  A   B
            |    +      ←  + = [0,0]
        -1  |  C   D
    */
    // This is the single sample for the unblurred, larger texture
    vec3 largeSample = texture(largerSampler, vTexCoord).rgb;

    // These are the four samples for upsampling the smaller texture
    vec3 A = texture(smallerSampler, vTexCoord + texelSize * vec2(-0.5, 0.5)).rgb;
    vec3 B = texture(smallerSampler, vTexCoord + texelSize * vec2( 0.5, 0.5)).rgb;
    vec3 C = texture(smallerSampler, vTexCoord + texelSize * vec2(-0.5,-0.5)).rgb;
    vec3 D = texture(smallerSampler, vTexCoord + texelSize * vec2( 0.5,-0.5)).rgb;

    vec3 blurSample = (A + B + C + D) * .25;

    // Add 100% of the blur sample with 100% of the larger, unblurred sample
    //                ↓blur samples↓      ↓unblurred↓
    fragColor.rgb =  (blurSample      +    largeSample) / 2.0;

    fragColor.a = 1.0;
}`

const UpSampleAndAddFragmentShaderSrc = `#version 300 es
#define BLOOM_BLENDMODE_ADD 0
precision mediump float;

uniform sampler2D smallerSampler;
uniform sampler2D largerSampler;
uniform vec2 texelSize;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
    /*  SAMPLES PATTERN
            -1   1
            + ------
        1   |  A   B
            |    +      ←  + = [0,0]
        -1  |  C   D
    */
    // This is the single sample for the unblurred, larger texture
    vec3 largeSample = texture(largerSampler, vTexCoord).rgb;

    // These are the four samples for upsampling the smaller texture
    vec3 A = texture(smallerSampler, vTexCoord + texelSize * vec2(-0.5, 0.5)).rgb;
    vec3 B = texture(smallerSampler, vTexCoord + texelSize * vec2( 0.5, 0.5)).rgb;
    vec3 C = texture(smallerSampler, vTexCoord + texelSize * vec2(-0.5,-0.5)).rgb;
    vec3 D = texture(smallerSampler, vTexCoord + texelSize * vec2( 0.5,-0.5)).rgb;

    vec3 blurSample = (A + B + C + D) * .25;

    // Add 100% of the blur sample with 100% of the larger, unblurred sample
    //                ↓blur samples↓      ↓unblurred↓
    fragColor.rgb =  blurSample      +    largeSample;

    fragColor.a = 1.0;
}`

const HorizontalGaussianBlurFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
uniform vec2 texelSize;

in vec2 vTexCoord;
out vec4 fragColor;

const float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
void main() {
    vec2 texOffset = vec2(texelSize.x, 0.0);
    vec3 result = texture(sampler, vTexCoord).rgb * weight[0];
    result += texture(sampler, vTexCoord + texOffset.xy * 1.0).rgb * weight[1];
    result += texture(sampler, vTexCoord + texOffset.xy * 2.0).rgb * weight[2];
    result += texture(sampler, vTexCoord + texOffset.xy * 3.0).rgb * weight[3];
    result += texture(sampler, vTexCoord + texOffset.xy * 4.0).rgb * weight[4];

    result += texture(sampler, vTexCoord - texOffset.xy * 1.0).rgb * weight[1];
    result += texture(sampler, vTexCoord - texOffset.xy * 2.0).rgb * weight[2];
    result += texture(sampler, vTexCoord - texOffset.xy * 3.0).rgb * weight[3];
    result += texture(sampler, vTexCoord - texOffset.xy * 4.0).rgb * weight[4];

    fragColor = vec4(result.rgb, 1.0);
}`

const VerticalGaussianBlurFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
uniform vec2 texelSize;

in vec2 vTexCoord;
out vec4 fragColor;

const float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
void main() {
    vec2 texOffset = vec2(0.0, texelSize.y);
    vec3 result = texture(sampler, vTexCoord).rgb * weight[0];
    result += texture(sampler, vTexCoord + texOffset.xy * 1.0).rgb * weight[1];
    result += texture(sampler, vTexCoord + texOffset.xy * 2.0).rgb * weight[2];
    result += texture(sampler, vTexCoord + texOffset.xy * 3.0).rgb * weight[3];
    result += texture(sampler, vTexCoord + texOffset.xy * 4.0).rgb * weight[4];

    result += texture(sampler, vTexCoord - texOffset.xy * 1.0).rgb * weight[1];
    result += texture(sampler, vTexCoord - texOffset.xy * 2.0).rgb * weight[2];
    result += texture(sampler, vTexCoord - texOffset.xy * 3.0).rgb * weight[3];
    result += texture(sampler, vTexCoord - texOffset.xy * 4.0).rgb * weight[4];

    fragColor = vec4(result.rgb, 1.0);
}`

const ToneMapFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D sampler;
in vec2 vTexCoord;
out vec4 fragColor;

float getLuminance(vec3 rgb)
{
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    return dot(rgb, W);
}

// Algorithms
float filmic_reinhard2(float x) {
    x *= 1.32;
    float k = 23.0;
    return (exp(-x*k) - 1.0)/k - 1.0/(x + 1.0) + 1.0;
}

vec3 filmic_reinhard2(vec3 x) {
    const float W = 2.0;
    float w = filmic_reinhard2(W);
    return vec3(
        filmic_reinhard2(x.r),
        filmic_reinhard2(x.g),
        filmic_reinhard2(x.b)) / w;
}

vec3 linear(vec3 value, vec3 max) {
    return value / max;
}

vec3 nativeTanh(vec3 color) {
    return tanh(color);
}

// https://varietyofsound.wordpress.com/2011/02/14/efficient-tanh-computation-using-lamberts-continued-fraction/
vec3 fastTanh(vec3 x)
{
    vec3 x2 = x * x;
    vec3 a = x * (135135.0 + x2 * (17325.0 + x2 * (378.0 + x2)));
    vec3 b = 135135.0 + x2 * (62370.0 + x2 * (3150.0 + x2 * 28.0));
    return a / b;
}

// Another curve-fitting approximation. I can't find where I got this, but I think it was on Math Exchange.
vec3 superfastTanh(vec3 x)
{
    vec3 x2 = x * x;
    return x * (27.0 + x2) / (27.0 + 9.0*x2);
}

// Original Eric Reinhard 2002
vec3 reinhard(vec3 source)
{
    return source / (source + 1.0);
}

// Reinhard's updated function, which aggressively passes through 1.0 (does not approach 1.0)
// https://bruop.github.io/tonemapping/
vec3 reinhardExtended(vec3 source, vec3 whiteRef)
{
    return source * (1.0 + (source / (whiteRef * whiteRef))) / (source + 1.0);
}

// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 ACES_Narkowicz(vec3 source)
{
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;

    vec3 color = source * vec3(.6);

    return clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0);
}

// Polyphony's Gran Turismo tone mapper, developed by Hajime Uchimura
// https://github.com/dmnsgn/glsl-tone-map/blob/main/uchimura.glsl
vec3 uchimura(vec3 x, float P, float a, float m, float l, float c, float b) {
    float l0 = ((P - m) * l) / a;
    float L0 = m - m / a;
    float L1 = m + (1.0 - m) / a;
    float S0 = m + l0;
    float S1 = m + a * l0;
    float C2 = (a * P) / (P - S1);
    float CP = -C2 / P;

    vec3 w0 = vec3(1.0 - smoothstep(0.0, m, x));
    vec3 w2 = vec3(step(m + l0, x));
    vec3 w1 = vec3(1.0 - w0 - w2);

    vec3 T = vec3(m * pow(x / m, vec3(c)) + b);
    vec3 S = vec3(P - (P - S1) * exp(CP * (x - S0)));
    vec3 L = vec3(m + a * (x - m));

    return T * w0 + L * w1 + S * w2;
}

vec3 uchimura(vec3 x) {
    // values can be determined via https://www.desmos.com/calculator/gslcdxvipg
    const float P = 1.0;  // max display brightness
    const float a = 1.0;  // contrast
    const float m = 0.22; // linear section start
    const float l = 0.4;  // linear section length
    const float c = 1.33; // black
    const float b = 0.0;  // pedestal

    return uchimura(x, P, a, m, l, c, b);
}

vec3 exposure(vec3 source, float exposure)
{
    return vec3(1.0) - exp(-source * exposure);
}
vec3 exposure2(vec3 source, float exposure)
{
    return vec3(1.0) / (vec3(1.0) + exp(-vec3(exposure) * source + vec3(exposure * .5)));
}
vec3 fastApproxUchimura(vec3 color)
{
    return pow(superfastTanh(pow(color, vec3(1.4))), vec3(.7));
}

void main()
{
    vec3 hdrColor = texture(sampler, vTexCoord).rgb;

    // Choose which algorithm you want to try:
    // fragColor.rgb = hdrColor; // no tone mapping
    // fragColor.rgb = linear(hdrColor, vec3(2.0));
    // fragColor.rgb = reinhard(hdrColor);
    // fragColor.rgb = reinhardExtended(hdrColor, vec3(4.0, 4.0, 4.0));
    // fragColor.rgb = ACES_Narkowicz(hdrColor);
    // fragColor.rgb = filmic_reinhard2(hdrColor) * 1.0;
    // fragColor.rgb = exposure(hdrColor, 1.5);
    // fragColor.rgb = exposure2(hdrColor, 3.4);
    // fragColor.rgb = nativeTanh(hdrColor);
    // fragColor.rgb = fastTanh(hdrColor);
    // fragColor.rgb = superfastTanh(hdrColor);
    fragColor.rgb = uchimura(hdrColor);
    // fragColor.rgb = fastApproxUchimura(hdrColor);

    // Correct gamma (if needed)
    // fragColor.rgb = pow(fragColor.rgb, vec3(1.0 / 2.2	));

    fragColor.a = 1.0;
}`

export function createVerticalGaussianBlurQuadShader(
    gl: WebGL2RenderingContext
) {
    return createShader(
        gl,
        VertexShaderSrc,
        VerticalGaussianBlurFragmentShader,
        ['sampler', 'texelSize'],
        ['aPos', 'aTexCoord']
    )
}

export function createHorizontalGaussianBlurQuadShader(
    gl: WebGL2RenderingContext
) {
    return createShader(
        gl,
        VertexShaderSrc,
        HorizontalGaussianBlurFragmentShader,
        ['sampler'],
        ['aPos', 'aTexCoord']
    )
}

export function createLuminanceThresholdQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        ThresholdShaderFragmentSrc,
        ['sampler'],
        ['aPos', 'aTexCoord']
    )
}

export function createDownSampleBlurQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        DownsampleBlurFragmentShaderSrc,
        ['texelSize'],
        ['aPos', 'aTexCoord']
    )
}

export function createUpSampleQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        UpSampleFragmentShaderSrc,
        ['texelSize', 'smallerSampler', 'largerSampler'],
        ['aPos', 'aTexCoord']
    )
}

export function createUpSampleAndAddQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        UpSampleAndAddFragmentShaderSrc,
        ['texelSize', 'smallerSampler', 'largerSampler'],
        ['aPos', 'aTexCoord']
    )
}

export function createToneMapQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        ToneMapFragmentShader,
        ['sampler'],
        ['aPos', 'aTexCoord']
    )
}

export function createRenderPassQuadShader(gl: WebGL2RenderingContext) {
    return createShader(
        gl,
        VertexShaderSrc,
        FragmentShaderSrc,
        ['sampler'],
        ['aPos', 'aTexCoord']
    )
}

export type RenderPassQuadShader = ReturnType<typeof createRenderPassQuadShader>
export type LuminanceThresholdRenderPassQuadShader = ReturnType<
    typeof createLuminanceThresholdQuadShader
>
