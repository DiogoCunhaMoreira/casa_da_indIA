shader_type spatial;
// Satin stainless steel: fine directional brushing, softened at distant zooms.
varying vec3 surface_position;
varying vec3 surface_normal;
void vertex() { surface_position = VERTEX; surface_normal = NORMAL; }
void fragment() {
 float axis = abs(surface_normal.y) > 0.6 ? surface_position.z : surface_position.y;
 float brushing = sin(axis * 1700.0 + sin(surface_position.x * 19.0) * 0.3);
 brushing *= 0.025 / (1.0 + abs(fwidth(axis)) * 1700.0);
 vec3 steel = vec3(0.60, 0.65, 0.68) + brushing;
 ALBEDO = steel;
 METALLIC = 0.65;
 ROUGHNESS = 0.32;
 SPECULAR = 0.8;
 // Keep the satin finish readable in the existing ambient-only reflection setup.
 EMISSION = steel * 0.065;
}
