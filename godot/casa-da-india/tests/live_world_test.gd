extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var scene = load("res://scenes/casa.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	var live = load("res://scripts/live_world.gd").new()
	scene.add_child(live)
	scene.live_world = live
	var roster: Array = []
	for i in range(24):
		roster.append({"id":"test-%d"%i,"name":"Oficial %d"%i,"character":"character-%d"%i,"status":"working","seat":i if i<22 else null,"selected":i==0,"isGod":i==0})
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
	for i in range(22):
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
