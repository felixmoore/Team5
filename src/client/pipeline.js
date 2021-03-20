// Custom texture pipeline used to make the clue sprites flash, needs to be
// moved to another file after MVP
class CustomPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      renderer: game.renderer,
      fragShader: [
        "precision lowp float;",
        "varying vec2 outTexCoord;",
        "varying vec4 outTint;",
        "uniform sampler2D uMainSampler;",
        "uniform float alpha;",
        "uniform float time;",
        "void main() {",
        "vec4 sum = vec4(0);",
        "vec2 texcoord = outTexCoord;",
        "for(int xx = -4; xx <= 4; xx++) {",
        "for(int yy = -4; yy <= 4; yy++) {",
        "float dist = sqrt(float(xx*xx) + float(yy*yy));",
        "float factor = 0.0;",
        "if (dist == 0.0) {",
        "factor = 2.0;",
        "} else {",
        "factor = 2.0/abs(float(dist));",
        "}",
        "sum += texture2D(uMainSampler, texcoord + vec2(xx, yy) * 0.002) * (abs(sin(time))+0.06);",
        "}",
        "}",
        "gl_FragColor = sum * 0.025 + texture2D(uMainSampler, texcoord)*alpha;",
        "}",
      ].join("\n"),
    });
  }
}

export default CustomPipeline;
