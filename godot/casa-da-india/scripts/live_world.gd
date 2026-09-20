extends Node
## The desktop owns agents; this adapter owns only their visual representation.
var host: Node3D
var bridge: JavaScriptObject
var callback: JavaScriptObject
var agents: Dictionary = {}
var room := "casa"
var navigation = preload("res://scripts/world_navigation.gd").new()
var break_places: Dictionary = {}
var task_label: Label3D
var message_ids: Array = []
var envelopes: Array = []
var metrics_time := 0.0
const CAPTIONS = {"idle":"Disponível", "working":"A trabalhar", "thinking":"A pensar", "compacting":"A organizar contexto", "waiting":"À espera", "blocked":"Precisa de ajuda", "success":"Concluído", "ghost":"Desligado", "looping":"A repetir", "typing":"A escrever"}
const CENTRES = {"gabinete": Vector3(-10.5,0,-11), "escrivaes": Vector3(10.5,0,-11), "conselho": Vector3(-10.5,0,0), "cartografia": Vector3(10.5,0,0), "tesouraria": Vector3(-10.5,0,11), "refeitorio": Vector3(10.5,0,11)}

func _ready() -> void:
	host = get_parent()
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
	task_label = Label3D.new()
	task_label.position = Vector3(0,3.0,8.0)
	task_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	task_label.font_size = 36
	task_label.pixel_size = 0.007
	task_label.text = "Tarefas"
	host.get_node("Maquete").add_child(task_label)
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
	if not data is Dictionary or data.get("version") != 1 or data.get("type") != "snapshot":
		return
	if not data.get("agents") is Array:
		return
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
			agents[id] = created
		var actor: Dictionary = agents[id]
		actor.name = str(item.get("name", ""))
		var old_state: String = actor.state
		actor.state = str(item.get("status", "idle"))
		if old_state != actor.state:
			actor.idle_time = 0.0
		actor.role = "Feitor" if item.get("isGod", false) else "Agente"
		actor.caption = CAPTIONS.get(actor.state, actor.state)
		actor.label.text = "%s · %s" % [actor.name, actor.caption]
		actor.ring.visible = item.get("selected", false)
		actor.label.visible = actor.ring.visible or actor.state in ["blocked","ghost"]
		# Working actors never run the autonomous demonstration routine.
		actor.live_working = actor.state in ["working", "thinking", "compacting", "typing", "looping"]
		var destination := seat_position(item.get("seat"))
		if item.get("seat") == null:
			actor.role = "À espera de lugar"
			actor.caption = "À espera de lugar"
			actor.label.text = "%s · À espera de lugar" % actor.name
			actor.label.visible = true
		actor.home = destination
		if actor.live_working:
			match item.get("station", "desk"):
				"board": destination = Vector3(0,0,8)
				"mailbox": destination = Vector3(1,0,6)
				"web", "mcp": destination = CENTRES.cartografia+Vector3(4.75,0,-0.35)
				"shelf":
					var centre := CENTRES.escrivaes as Vector3
					for entry in CENTRES.values():
						if Vector2(entry.x-actor.home.x,entry.z-actor.home.z).length() < 9.0:
							centre = entry
							break
					destination = centre+Vector3(0,0,-3.0)
		if actor.state == "blocked":
			destination = Vector3(-1.0,0,14.5-float(agents.keys().find(id))*0.65)
		if item.get("seat") == null:
			destination = Vector3(3.0+float(agents.keys().find(id)%12)*0.8,0,17.5)
		if actor.state != "idle":
			actor.break_stage = ""
			break_places.erase(id)
		if actor.break_stage == "":
			move_to(actor,destination)
	for id in agents.keys():
		if not keep.has(id):
			host.officials.erase(agents[id])
			agents[id].node.queue_free()
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
	var counts := {"todo":0,"doing":0,"done":0,"blocked":0}
	for task in data.get("tasks",[]):
		var status: String = task.get("status","todo")
		counts[status] = counts.get(status,0)+1
	task_label.text = "Tarefas · %d por fazer · %d em curso · %d concluídas\n%d perguntas para ti" % [counts.todo, counts.doing, counts.done, data.get("humanQuestions",0)]
	var next_room: String = data.get("room", "casa")
	if next_room != room:
		view_room(next_room)
	host.info.text = "%d agentes · Estado em tempo real" % agents.size()

func seat_position(seat: Variant) -> Vector3:
	if seat == null:
		return Vector3(1.2,0,17.4)
	var n := int(seat)
	if n == 0:
		return CENTRES.gabinete + Vector3(0,0,-2.6)
	if n <= 8:
		return CENTRES.escrivaes + Vector3(-5.4 + ((n-1)%4)*3.6,0,-0.8 if n <= 4 else 2.5)
	if n <= 11:
		return CENTRES.cartografia + [Vector3(-2.8,0,1.75),Vector3(4.75,0,-0.35),Vector3(0.4,0,1.75)][n-9]
	if n <= 15:
		return CENTRES.tesouraria + [Vector3(-2.6,0,1.25),Vector3(-0.7,0,1.25),Vector3(1.2,0,1.25),Vector3(5.35,0,1.55)][n-12]
	return CENTRES.conselho + Vector3(-4.25 if n < 19 else 4.25,0,-2.0+((n-16)%3)*2.0)

func view_room(next: String) -> void:
	if next != "casa" and not CENTRES.has(next):
		return
	room = next
	host.camera_focus = Vector3(0,0.2,2.5) if room == "casa" else CENTRES[room] + Vector3(0,0.8,0)
	host.camera.size = 49.0 if room == "casa" else 18.8
	host.update_camera()
	emit({"type":"view", "room":room})

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
	if actor.state != "idle":
		return
	actor.idle_time += delta
	var id: String = actor.live_id
	if actor.break_stage == "" and actor.idle_time > 18.0 + float(absi(id.hash())%15):
		if break_places.size() >= 4:
			return
		var used := break_places.values()
		for place in range(4):
			if place not in used:
				break_places[id] = place
				break
		actor.break_stage = "serve"
		actor.idle_time = 0.0
		move_to(actor,CENTRES.refeitorio+Vector3(-0.5,0,-2.55))
	elif actor.break_stage != "" and actor.node.position.distance_to(actor.destination) < 0.15:
		var place: int = break_places.get(id,0)
		if actor.break_stage == "serve" and actor.idle_time > 4.0:
			actor.break_stage = "eat"
			actor.idle_time = 0.0
			move_to(actor,CENTRES.refeitorio+[Vector3(-3.4,0,1.8),Vector3(-3.4,0,-0.78),Vector3(3.7,0,-0.30),Vector3(5.5,0,0.9)][place])
		elif actor.break_stage == "eat" and actor.idle_time > 18.0:
			actor.break_stage = "wash"
			actor.idle_time = 0.0
			move_to(actor,CENTRES.refeitorio+Vector3(6.5,0,-2.5))
		elif actor.break_stage == "wash" and actor.idle_time > 5.0:
			actor.break_stage = "return"
			move_to(actor,actor.home)
		elif actor.break_stage == "return":
			actor.break_stage = ""
			actor.idle_time = -60.0
			break_places.erase(id)

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
		var letter = host.box(host.get_node("Maquete"),"Correspondencia",start,Vector3(0.32,0.22,0.05),Color("f2e6ce"))
		envelopes.append(letter)
		var tween := create_tween()
		tween.tween_property(letter,"position",(start+end)*0.5+Vector3(0,2,0),0.6)
		tween.tween_property(letter,"position",end,0.6)
		tween.tween_callback(func(): envelopes.erase(letter); letter.queue_free())

func _process(delta: float) -> void:
	metrics_time += delta
	if metrics_time >= 1.0 and bridge != null:
		metrics_time = 0.0
		bridge.metrics(JSON.stringify({"fps":Engine.get_frames_per_second(),"agents":agents.size(),"room":room,"nodes":get_tree().get_node_count(),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)}))
