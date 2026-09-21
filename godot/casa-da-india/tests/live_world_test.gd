extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var scene = load("res://scenes/casa.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	verify_camera(scene)
	verify_doors(scene)
	verify_continuous_walk(scene)
	var live = load("res://scripts/live_world.gd").new()
	scene.add_child(live)
	scene.live_world = live
	var roster: Array = []
	for i in range(24):
		roster.append({"id":"test-%d"%i,"name":"Oficial %d"%i,"character":"character-%d"%i,"status":"working","seat":live.SEAT_IDS[i] if i<live.SEAT_IDS.size() else null,"selected":i==0,"isGod":i==0})
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	assert(live.agents.size()==24)
	var identity: int = live.agents["test-0"].node.get_instance_id()
	for room in live.CENTRES:
		live.view_room(room)
		assert(live.agents["test-0"].node.get_instance_id()==identity)
	roster[0].name = "Nome personalizado"
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	assert(live.agents["test-0"].name == "Nome personalizado")
	assert(live.agents["test-0"].node.get_instance_id()==identity)
	var failed := 0
	for i in live.SEAT_IDS:
		var path = live.navigation.route(live.seat_position(i),Vector3(0,0,14))
		if path.is_empty():
			printerr("UNREACHABLE SEAT ",i)
			failed += 1
	for point in [Vector3(-0.5,0,-2.55),Vector3(-3.4,0,1.8),Vector3(-3.4,0,-0.78),Vector3(3.7,0,-0.30),Vector3(5.5,0,0.9),Vector3(6.5,0,-2.5)]:
		assert(not live.navigation.route(Vector3(0,0,14),live.CENTRES.refeitorio+point).is_empty(),"Refeitório inacessível")
	roster[1].status = "idle"
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	live.tick(live.agents["test-1"],40.0)
	assert(live.agents["test-1"].break_stage == "serve")
	roster[1].status = "working"
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	assert(live.agents["test-1"].break_stage == "")
	assert(not live.break_places.has("test-1"))
	roster[1].status = "blocked"
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	assert(live.agents["test-1"].state == "blocked")
	assert(live.agents["test-22"].role == "À espera de lugar")
	roster.pop_back()
	live.apply_snapshot({"version":1,"type":"snapshot","room":"casa","visible":true,"agents":roster})
	assert(live.agents.size()==23)
	print("LIVE WORLD: identity, roster, rooms, states verified; unreachable seats: ",failed)
	quit(1 if failed else 0)

func verify_doors(scene: Node3D) -> void:
	for room in scene.get_node("Maquete/CasaCompleta").get_children():
		if room.name not in ["Gabinete do Feitor","Escrivães","Conselho","Cartografia","Tesouraria","Refeitório e Adega"]:
			continue
		# Conservative envelope of the entire door swing, including a safety margin.
		var zone := AABB(Vector3(-8.35 if room.position.x>0 else 5.65,0.15,1.35),Vector3(2.7,3.0,2.65))
		for mesh in room.find_children("*","MeshInstance3D",true,false):
			if not mesh.is_visible_in_tree():
				continue
			var bounds: AABB = room.global_transform.affine_inverse()*mesh.global_transform*mesh.get_aabb()
			assert(not bounds.intersects(zone),"Objeto na abertura da porta: %s" % mesh.get_path())

func verify_continuous_walk(scene: Node3D) -> void:
	for hz in [30,60,120]:
		var actor := Node3D.new()
		scene.add_child(actor)
		var route: Array = [Vector3.ZERO]
		for i in range(1,41):
			route.append(Vector3(float(i)*0.25,0,0))
		var a := {"node":actor,"route":route,"target":1,"wait":0.0,"speed":0.0,"facing":0.0}
		for frame in range(hz*4):
			var travelled: float = scene.advance_live(a,1.0/hz)
			if frame > hz:
				assert(travelled*hz > 1.14,"Interrupção num ponto intermédio do percurso")
		assert(actor.position.x > 4.25 and actor.position.x < 4.4,"Velocidade depende do framerate")
		for frame in range(hz*8):
			scene.advance_live(a,1.0/hz)
		assert(actor.position.is_equal_approx(Vector3(10,0,0)),"Ultrapassou o destino")
		actor.queue_free()
	print("DOORS / WALK: six clear door sweeps; continuous movement at 30, 60 and 120 Hz")

func verify_camera(scene) -> void:
	var point := Vector2(280, 220)
	var before: Vector3 = scene.ground_at(point)
	scene.zoom_camera(0.5, point)
	assert(scene.ground_at(point).distance_to(before) < 0.001, "Zoom must preserve the ground under the pointer")
	var focus: Vector3 = scene.camera_focus
	var selected_before: int = scene.selected
	var press := InputEventMouseButton.new()
	press.button_index = MOUSE_BUTTON_LEFT
	press.pressed = true
	press.position = point
	scene._unhandled_input(press)
	var motion := InputEventMouseMotion.new()
	motion.button_mask = MOUSE_BUTTON_MASK_LEFT
	motion.position = point + Vector2(130, 90)
	motion.relative = Vector2(130, 90)
	scene._unhandled_input(motion)
	assert(scene.camera_focus.distance_to(focus) > 0.1, "Left drag must move the camera")
	assert(absf(scene.camera_focus.y - focus.y) < 0.001, "Pan must stay on the ground plane")
	assert(scene.ground_at(motion.position).distance_to(before) < 0.001, "Ground must follow the drag")
	press.pressed = false
	press.position = motion.position
	scene._unhandled_input(press)
	assert(scene.selected == selected_before, "Dragging must not select an agent or open a room")
	print("Camera: cursor zoom and left drag passed")
