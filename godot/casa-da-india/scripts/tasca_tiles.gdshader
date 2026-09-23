shader_type spatial;
render_mode cull_disabled;
uniform vec2 repeats = vec2(16.0, 3.0);
uniform vec3 ivory : source_color = vec3(0.91, 0.92, 0.87);
uniform vec3 cobalt : source_color = vec3(0.08, 0.23, 0.49);
uniform vec3 pale_blue : source_color = vec3(0.42, 0.64, 0.79);
// Original ceramic pattern: quatrefoil, diamond, corner fans and double blue border.
void fragment() {
 vec2 tile = UV * repeats;
 vec2 p = fract(tile) - 0.5;
 float aa = max(fwidth(tile.x), fwidth(tile.y)) * 0.8;
 float edge = max(abs(p.x), abs(p.y));
 float grout = smoothstep(0.476-aa, 0.49, edge);
 float border = 1.0-smoothstep(0.013, 0.013+aa, abs(edge-0.438));
 float inner_border = 1.0-smoothstep(0.007, 0.007+aa, abs(edge-0.396));
 vec2 q = abs(p);
 float petal = min(length(q-vec2(0.18,0.0)),length(q-vec2(0.0,0.18)));
 float flower = 1.0-smoothstep(0.125-aa,0.125+aa,petal);
 float petal_line = 1.0-smoothstep(0.015,0.015+aa,abs(petal-0.102));
 float diamond = 1.0-smoothstep(0.155-aa,0.155+aa,q.x+q.y);
 float centre = 1.0-smoothstep(0.045-aa,0.045+aa,length(p));
 float fan_r = length(q-vec2(0.395));
 float fan = (1.0-smoothstep(0.22,0.22+aa,fan_r)) * smoothstep(0.165-aa,0.165+aa,fan_r);
 float fan2 = 1.0-smoothstep(0.012,0.012+aa,abs(fan_r-0.115));
 float corner = 1.0-smoothstep(0.047-aa,0.047+aa,fan_r);
 vec3 color = ivory;
 color = mix(color,pale_blue,flower*0.8);
 color = mix(color,cobalt,clamp(border+inner_border+petal_line+diamond+fan+fan2+corner,0.0,1.0));
 color = mix(color,ivory,centre);
 float variation = sin(floor(tile.x)*7.3+floor(tile.y)*11.9)*0.018;
 ALBEDO = mix(color+variation,vec3(0.70,0.70,0.63),grout);
 ROUGHNESS = 0.31;
 SPECULAR = 0.45;
}
