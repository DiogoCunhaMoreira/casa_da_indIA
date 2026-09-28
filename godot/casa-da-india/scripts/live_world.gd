extends Node
## The desktop owns agents; this adapter owns only their visual representation.
var host: Node3D
var bridge: JavaScriptObject
var callback: JavaScriptObject
var agents: Dictionary = {}
var room := "casa"
var navigation = preload("res://scripts/world_navigation.gd").new()
var break_places: Dictionary = {}
var message_ids: Array = []
var envelopes: Array = []
var metrics_time := 0.0
const SEAT_IDS = [0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]
const CAPTIONS = {"idle":"Disponível", "working":"A trabalhar", "thinking":"A pensar", "compacting":"A organizar contexto", "waiting":"À espera", "blocked":"Precisa de ajuda", "success":"Concluído", "ghost":"Desligado", "looping":"A repetir", "typing":"A escrever"}
var life: RefCounted
var bubbles: CanvasLayer
var definition: RefCounted
var CENTRES: Dictionary

func _ready() -> void:
	host = get_parent()
	definition = host.world_definition
	CENTRES = definition.CENTRES
	room = definition.OVERVIEW
	life = preload("res://scripts/world_life.gd").new(self)
	bubbles = preload("res://scripts/world_bubbles.gd").new()
	add_child(bubbles)
	for actor in host.officials:
		actor.node.queue_free()
	host.officials.clear()
	host.selected = -1
	host.info.text = "A ligar aos agentes da aplicação…"
	navigation.build(host.get_node("Maquete/CasaCompleta"))
	var batches = preload("res://scripts/static_batches.gd").new()
	for section in host.get_node("Maquete/CasaCompleta").get_children():
		if section is Node3D:
			batches.batch(section)

	if OS.has_feature("web"):
		bridge = JavaScriptBridge.get_interface("casaBridge")
		callback = JavaScriptBridge.create_callback(receive)
		bridge.listen(callback)

func emit(message: Dictionary) -> void:
	if bridge != null:
		bridge.emit(JSON.stringify(message))

func receive(args: Array) -> void:
	var data = JSON.parse_string(str(args[0]))
	if data is Dictionary and data.get("type") == "message":
		show_message(data)
		return
	if data is Dictionary and data.get("type") == "control":
		if data.get("action") == "zoom_in":
			host.zoom_camera(0.85)
		elif data.get("action") == "zoom_out":
			host.zoom_camera(1.0/0.85)
		elif data.get("action") == "walls":
			host.toggle_plan_walls()
		return
	apply_snapshot(data)

func apply_snapshot(data: Variant) -> void:
	if not data is Dictionary or data.get("version") != 2 or data.get("type") != "snapshot":
		return
	if data.get("scenario", "casadaindia") != definition.ID:
		return
	if not data.get("agents") is Array:
		return
	life.done_counts.clear()
	for task in data.get("tasks",[]):
		if task is Dictionary and task.get("status")=="done":
			var assignee: String = str(task.get("assignee",""))
			life.done_counts[assignee] = life.done_counts.get(assignee,0)+1
	var keep := {}
	for item in data.agents:
		if not item is Dictionary or not item.get("id") is String:
			continue
		var id: String = item.id
		keep[id] = true
		var previous_position: Variant = null
		var appearance_key := str(item.get("character", "")) + str(item.get("appearance", {}))
		if agents.has(id) and agents[id].appearance_key != appearance_key:
			previous_position = agents[id].node.position
			host.officials.erase(agents[id])
			agents[id].node.queue_free()
			life.remove_actor(agents[id])
			bubbles.remove_actor(id)
			agents.erase(id)
		if not agents.has(id):
			var variant := absi(str(item.get("character", "")).hash()) % 3
			var pos: Vector3 = navigation.stand(seat_position(item.get("seat"))) if previous_position == null else previous_position
			var appearance: Dictionary = item.get("appearance", {})
			var cloth := Color(appearance.get("cloth", ["487b80","73844b","9b5149"][variant]))
			host.make_official(host.get_node("Maquete"), str(item.get("name", "")), "", cloth, [pos,pos], variant, appearance)
			var created: Dictionary = host.officials.back()
			created.live_id = id
			created.appearance_key = appearance_key
			created.idle_time = 0.0
			created.break_stage = ""
			created.destination = pos
			life.init_actor(created)
			agents[id] = created
			bubbles.add_actor(id)
		var actor: Dictionary = agents[id]
		actor.name = str(item.get("name", ""))
		var old_state: String = actor.state
		actor.state = str(item.get("status", "idle"))
		if old_state != actor.state:
			actor.idle_time = 0.0
		actor.is_god = bool(item.get("isGod", false))
		actor.has_seat = item.get("seat") != null
		actor.role = ("Taberneiro" if definition.ID == "tasca" else "Feitor") if actor.is_god else "Agente"
		actor.caption = CAPTIONS.get(actor.state, actor.state)
		actor.action = str(item.get("action", "")).strip_edges().left(240)
		actor.prompt = str(item.get("lastPrompt", "")).strip_edges().left(240)
		actor.tool = str(item.get("carrying", ""))
		actor.ring.visible = item.get("selected", false)
		actor.label.visible = false # Screen-space thought clouds replace the old selected-only label.
		actor.live_working = actor.state in ["working", "thinking", "compacting", "typing"]
		actor.home = seat_position(item.get("seat"))
		life.apply_state(actor,old_state)

	for id in agents.keys():
		if not keep.has(id):
			host.officials.erase(agents[id])
			agents[id].node.queue_free()
			life.remove_actor(agents[id])
			bubbles.remove_actor(id)
			agents.erase(id)
			break_places.erase(id)
	host.selected = -1
	for i in range(host.officials.size()):
		if host.officials[i].ring.visible:
			host.selected = i
	host.paused = not data.get("visible", true)
	if OS.has_feature("web"):
		RenderingServer.render_loop_enabled = not host.paused
		Engine.max_fps = 5 if host.paused else 60
	var next_room: String = data.get("room", definition.OVERVIEW)
	if next_room != room:
		view_room(next_room)
	host.info.text = "%d agentes · Estado em tempo real" % agents.size()

func seat_position(seat: Variant) -> Vector3:
	return definition.seat_position(seat)

func view_room(next: String) -> void:
	if next != definition.OVERVIEW and not CENTRES.has(next):
		return
	room = next
	host.camera_focus = definition.OVERVIEW_FOCUS if room == definition.OVERVIEW else CENTRES[room] + Vector3(0,0.8,0)
	host.camera.size = definition.OVERVIEW_SIZE if room == definition.OVERVIEW else 18.8
	host.update_camera()
	emit({"type":"view", "scenario":definition.ID, "room":room})

func move_to(actor: Dictionary, target: Vector3) -> void:
	var goal: Vector3 = navigation.stand(target)
	if actor.destination.distance_to(goal) < 0.05:
		return
	var path: Array = navigation.route(actor.node.position, goal)
	if path.is_empty():
		actor.role = "Percurso indisponível"
		return
	actor.destination = goal
	actor.route = path if path.size() > 1 else [goal,goal]
	actor.target = 1
	actor.wait = 0.0

func tick(actor: Dictionary, delta: float) -> void:
	life.tick(actor,delta)

func show_message(data: Dictionary) -> void:
	if data.get("id") in message_ids or not agents.has(data.get("from")):
		return
	message_ids.append(data.get("id"))
	if message_ids.size() > 100:
		message_ids.pop_front()
	for target in data.get("targets",[]):
		if not agents.has(target) or envelopes.size() >= 24:
			continue
		var start: Vector3 = agents[data.from].node.position + Vector3(0,2,0)
		var end: Vector3 = agents[target].node.position + Vector3(0,2,0)
		var letter = host.box(host.get_node("Maquete"),"Correspondencia",start,(Vector3(0.18,0.36,0.025) if definition.ID == "tasca" else Vector3(0.32,0.22,0.05)),Color("f2e6ce"))
		envelopes.append(letter)
		var tween := create_tween()
		tween.tween_property(letter,"position",(start+end)*0.5+Vector3(0,2,0),0.6)
		tween.tween_property(letter,"position",end,0.6)
		tween.tween_callback(func(): envelopes.erase(letter); letter.queue_free())

func _process(delta: float) -> void:
	if not host.paused:
		life.update(delta)
		bubbles.update_bubbles(agents,host.camera,life)
	metrics_time += delta
	if metrics_time >= 1.0 and bridge != null:
		metrics_time = 0.0
		bridge.metrics(JSON.stringify({"fps":Engine.get_frames_per_second(),"agents":agents.size(),"room":room,"scenario":definition.ID,"nodes":get_tree().get_node_count(),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"walking":agents.values().filter(func(a): return a.node.position.distance_to(a.destination)>0.15).size(),"bubbles":bubbles.cards.values().filter(func(c): return c.panel.visible).size(),"breaks":break_places.size()}))
