extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var scene = load("res://scenes/casa.tscn").instantiate()
	scene.scenario = "tasca"
	root.add_child(scene)
	await process_frame
	var live = scene.live_world
	assert(live.definition.ID == "tasca")
	assert(live.room == "tasca")
	var roster: Array = []
	for i in range(24):
		roster.append({"id":"agent-%d"%i,"name":"Nome %d"%i,"character":"tasca-manuel","status":"working","seat":live.SEAT_IDS[i] if i<21 else null,"selected":i==0,"isGod":i==0})
	var snapshot := {"version":2,"type":"snapshot","scenario":"tasca","room":"tasca","visible":true,"agents":roster}
	live.apply_snapshot(snapshot)
	assert(live.agents.size() == 24)
	var identity: int = live.agents["agent-0"].node.get_instance_id()
	for zone in live.CENTRES:
		live.view_room(zone)
		assert(live.room == zone)
		assert(live.agents["agent-0"].node.get_instance_id() == identity)
	for seat in live.SEAT_IDS:
		var home: Vector3 = live.seat_position(seat)
		assert(live.navigation.stand(home).distance_to(home) < 0.4,"Seat inside furniture: %s"%seat)
		assert(not live.navigation.route(home,Vector3(0,0,8)).is_empty(),"Unreachable seat: %s"%seat)
		for station in ["desk","terminal","web","mcp","board","mailbox","shelf"]:
			assert(not live.navigation.route(home,live.definition.station_position(station,home)).is_empty(),"Unreachable station")
	for stage in ["serve","eat","wash"]:
		for place in range(4):
			assert(not live.navigation.route(Vector3(0,0,8),live.definition.break_position(stage,place)).is_empty(),"Unreachable break")
	for i in range(24):
		assert(not live.navigation.route(Vector3(0,0,8),live.definition.waiting_position(i)).is_empty())
		assert(not live.navigation.route(Vector3(0,0,8),live.definition.blocked_position(i)).is_empty())
	roster[1].status = "idle"
	live.apply_snapshot(snapshot)
	live.tick(live.agents["agent-1"],40)
	assert(live.agents["agent-1"].break_stage == "serve")
	roster[1].status = "working"
	live.apply_snapshot(snapshot)
	assert(live.agents["agent-1"].break_stage == "")
	assert(not live.break_places.has("agent-1"))
	assert(live.agents["agent-23"].role == "À espera de lugar")
	roster[0].name = "Nome personalizado"
	live.apply_snapshot(snapshot)
	assert(live.agents["agent-0"].name == "Nome personalizado")
	assert(live.agents["agent-0"].node.get_instance_id() == identity)
	snapshot.scenario = "casadaindia"
	snapshot.agents = []
	live.apply_snapshot(snapshot)
	assert(live.agents.size() == 24,"Wrong scenario must not clear the roster")
	print("TASCA: 21 seats, 24 agents, all stations, breaks, waiting, identity and scenario isolation passed")
	quit()
