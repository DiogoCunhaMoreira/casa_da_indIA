extends RefCounted
## Batch repeated static details per room, preserving room/wall visibility groups.
func batch(root: Node3D) -> void:
	var groups := {}
	collect(root,groups)
	for group in groups.values():
		if group.size() < 3:
			continue
		var source: MeshInstance3D = group[0]
		var instances := MultiMesh.new()
		instances.transform_format = MultiMesh.TRANSFORM_3D
		instances.mesh = source.mesh
		instances.instance_count = group.size()
		var node := MultiMeshInstance3D.new()
		node.multimesh = instances
		node.material_override = source.material_override
		node.cast_shadow = source.cast_shadow
		root.add_child(node)
		var inverse := root.global_transform.affine_inverse()
		for i in range(group.size()):
			instances.set_instance_transform(i,inverse*group[i].global_transform)
			group[i].queue_free()

func collect(node: Node, groups: Dictionary) -> void:
	if node is Node3D and not node.is_visible_in_tree():
		return
	if node is MeshInstance3D and node.mesh is PrimitiveMesh:
		var mesh: PrimitiveMesh = node.mesh
		var dimensions: Array = [mesh.get_class()]
		if mesh is BoxMesh:
			dimensions.append(mesh.size)
		elif mesh is CylinderMesh:
			dimensions.append_array([mesh.top_radius,mesh.bottom_radius,mesh.height,mesh.radial_segments])
		elif mesh is SphereMesh:
			dimensions.append_array([mesh.radius,mesh.height,mesh.radial_segments,mesh.rings])
		elif mesh is TorusMesh:
			dimensions.append_array([mesh.inner_radius,mesh.outer_radius,mesh.rings,mesh.ring_segments])
		else:
			return
		dimensions.append(node.material_override.get_instance_id() if node.material_override else 0)
		dimensions.append(node.cast_shadow)
		var key := str(dimensions)
		if not groups.has(key):
			groups[key] = []
		groups[key].append(node)
	for child in node.get_children():
		collect(child,groups)
