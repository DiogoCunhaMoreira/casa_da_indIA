extends RefCounted
## Derive walkable space from the same visible geometry used to render the rooms.
const CELL := 0.25
const ORIGIN := Vector3(-19,0,-16.75)
var grid := AStarGrid2D.new()

func build(world: Node3D) -> void:
	grid.region = Rect2i(0,0,152,144)
	grid.cell_size = Vector2(CELL,CELL)
	grid.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES
	grid.update()
	mark_geometry(world)

func mark_geometry(node: Node) -> void:
	if node is Node3D and not node.is_visible_in_tree():
		return
	if node is MeshInstance3D:
		var bounds: AABB = node.global_transform * node.get_aabb()
		# Furniture, doors and walls; exclude floor, rugs and overhead decoration.
		if bounds.end.y > 0.30 and bounds.position.y < 1.65:
			var start := cell(bounds.position - Vector3(0.28,0,0.28))
			var end := cell(bounds.end + Vector3(0.28,0,0.28))
			for x in range(maxi(0,start.x), mini(grid.region.size.x,end.x+1)):
				for y in range(maxi(0,start.y), mini(grid.region.size.y,end.y+1)):
					grid.set_point_solid(Vector2i(x,y))
	for child in node.get_children():
		mark_geometry(child)

func cell(point: Vector3) -> Vector2i:
	return Vector2i(roundi((point.x-ORIGIN.x)/CELL), roundi((point.z-ORIGIN.z)/CELL))

func world_point(point: Vector2i) -> Vector3:
	return ORIGIN + Vector3(point.x*CELL,0,point.y*CELL)

func nearest(point: Vector3) -> Vector2i:
	var centre := cell(point)
	var best := Vector2i(-1,-1)
	var distance := INF
	for x in range(centre.x-8,centre.x+9):
		for y in range(centre.y-8,centre.y+9):
			var candidate := Vector2i(x,y)
			if not grid.is_in_boundsv(candidate) or grid.is_point_solid(candidate):
				continue
			var d := Vector2(candidate-centre).length_squared()
			if d < distance:
				best = candidate
				distance = d
	return best

func stand(point: Vector3) -> Vector3:
	var p := nearest(point)
	return point if p.x < 0 else world_point(p)

func route(from: Vector3, to: Vector3) -> Array:
	var start := nearest(from)
	var end := nearest(to)
	if start.x < 0 or end.x < 0:
		return []
	var points := grid.get_id_path(start,end)
	var result: Array = []
	for point in points:
		result.append(world_point(point))
	return result
