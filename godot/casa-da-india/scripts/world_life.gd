extends RefCounted
## OfficeFloor behaviour adapted to the two 3D sets. Never drives real agent work.
var live: Node
var rng := RandomNumberGenerator.new()
var cafe_cooldown := 5.0
var errand_cooldown := 9.0
var clean_cups := 8
var errands: Dictionary = {}
var done_counts: Dictionary = {}
const BUSY = ["working","thinking","typing","compacting"]
const FREE = ["idle","success"]

func _init(world: Node) -> void:
	live = world
	rng.randomize()

func init_actor(a: Dictionary) -> void:
	a.merge({"is_god":false,"has_seat":true,"action":"","prompt":"","tool":"","busy_time":0.0,"social":"","social_time":0.0,"phase_time":0.0,"walk_time":0.0,"arrived":false,"roam_time":0.0,"break_stage":"","partner":"","chat_index":0,"chat_time":0.0,"chat_owner":false,"errand":-1,"cup":false,"cup_home":false,"aura_time":0.0,"cheer_time":0.0,"social_kind":"Pausa"})
	var cup = live.host.pivot(a.body,"CanecaPausa",Vector3(0.42,0.92,0.28))
	live.host.round_shape(cup,"Caneca",Vector3.ZERO,0.075,0.16,Color("e8dfc8"))
	var handle = live.host.torus(cup,Vector3(0.09,0,0),0.045,0.014,Color("e8dfc8"))
	handle.rotation.x = PI/2
	cup.visible = false
	a.cup_node = cup

func eligible(a: Dictionary) -> bool:
	return a.has_seat and not a.is_god and a.state in FREE and a.break_stage == ""

func stop(a: Dictionary) -> void:
	a.route = [a.node.position,a.node.position]
	a.target = 1
	a.destination = a.node.position
	a.speed = 0.0

func remove_actor(a: Dictionary) -> void:
	cancel(a)
	if a.cup or a.cup_home: clean_cups = mini(8,clean_cups+1)

func cancel(a: Dictionary) -> void:
	if live.agents.has(a.partner):
		var other: Dictionary = live.agents[a.partner]
		other.partner = ""
		other.chat_owner = false
		other.social = ""
		other.social_time = 0.0
	a.partner = ""
	a.chat_owner = false
	live.break_places.erase(a.live_id)
	if a.errand >= 0: errands.erase(a.errand)
	a.errand = -1
	a.break_stage = ""
	a.social = ""
	a.social_time = 0.0
	a.cheer_time = 0.0

func apply_state(a: Dictionary, previous: String) -> void:
	if not a.is_god and previous in BUSY and a.state in FREE and a.busy_time >= 60.0:
		cancel(a)
		say(a,"Trabalho concluído!",3.5,"Concluído")
		a.cheer_time = 3.5
	if a.state not in BUSY: a.busy_time = 0.0
	if not a.has_seat:
		cancel(a)
		a.role = "À espera de lugar"
		a.caption = a.role
		live.move_to(a,live.definition.waiting_position(live.agents.keys().find(a.live_id)))
		return
	if a.state not in FREE:
		cancel(a)
		if a.state == "blocked":
			live.move_to(a,live.definition.blocked_position(live.agents.keys().find(a.live_id)))
		elif a.state in ["ghost","looping"]:
			stop(a)
		else:
			# Read, Bash, Web, MCP etc. all happen at the assigned workstation.
			live.move_to(a,a.home)
	elif a.is_god and a.break_stage == "":
		live.move_to(a,a.home)
	elif previous not in FREE:
		a.roam_time = 0.0

func say(a: Dictionary, words: String, duration: float = 5.0, kind: String = "Pausa") -> void:
	a.social_kind = kind
	a.social = words
	a.social_time = duration

func activity(a: Dictionary) -> String:
	if not a.has_seat: return "À espera de lugar"
	if a.state == "ghost": return ""
	if a.state in FREE:
		if a.social_time > 0: return a.social
		if a.break_stage == "table": return "A caminho da pausa"
		if a.break_stage == "chat": return "Um momento de descanso."
		if a.break_stage in ["tray","brew","wash","rack","return"]: return "Pausa para uma caneca"
		if a.is_god: return "A coordenar a equipa"
		return "Disponível"
	if a.action and a.action.to_lower() not in ["idle","working","thinking","starting","starting up","resumed"]:
		return a.action
	if a.prompt and a.state in BUSY:
		return " ".join(a.prompt.split(" ",false).slice(0,6)).left(80) + "…"
	return {"working":"…","thinking":"…","typing":"…","waiting":"À espera de outro agente","blocked":"Preciso da tua ajuda","compacting":"A organizar contexto","looping":"Execução interrompida: repetição"}.get(a.state,a.caption)

func start_leg(a: Dictionary, phase: String, target: Vector3) -> void:
	a.break_stage = phase
	a.arrived = false
	a.phase_time = 0.0
	a.walk_time = 0.0
	live.move_to(a,target)

func coffee_position(stage: String) -> Vector3:
	var base: Vector3 = live.definition.break_position("serve" if stage in ["tray","brew","rack"] else "wash")
	if stage in ["tray","rack"]: base += Vector3(1.2,0,0)
	return base

func start_break(a: Dictionary) -> void:
	if not eligible(a) or live.break_places.size() >= 4: return
	var free: Array = []
	var social: Array = []
	var used: Array = live.break_places.values()
	for i in range(4):
		if i not in used:
			free.append(i)
			if (i ^ 1) in used: social.append(i)
	var pool: Array = social if not social.is_empty() and rng.randf()<0.55 else free
	var place: int = pool[rng.randi_range(0,pool.size()-1)]
	live.break_places[a.live_id] = place
	if a.cup_home:
		a.cup_home = false
		a.cup = true
	start_leg(a,"table",live.definition.break_position("eat",place))

func roam(a: Dictionary) -> void:
	# Choose reachable points inside a room, not through a wall or outside the building.
	var centres: Array = live.CENTRES.values()
	for attempt in range(8):
		var centre: Vector3 = centres[rng.randi_range(0,centres.size()-1)]
		var target: Vector3 = live.navigation.stand(centre+Vector3(rng.randf_range(-4.8,4.8),0,rng.randf_range(-2.5,3.5)))
		if target.distance_to(a.node.position)>1.0 and not live.navigation.route(a.node.position,target).is_empty():
			live.move_to(a,target)
			return

func errand_spots() -> Array:
	if live.definition.ID == "tasca":
		return [
			[live.CENTRES.balcao+Vector3(-4.6,0,3.3),"As plantas também têm sede.",5.0],
			[live.CENTRES.mesas+Vector3(-5.2,0,0),"Vou abrir um pouco a janela.",5.0],
			[live.CENTRES.despensa+Vector3(4.8,0,-2.9),"Ainda há azeite na despensa?",4.0],
			[live.CENTRES.balcao+Vector3(0,0,2),"Uma pequena pausa antes de voltar ao balcão.",7.0]]
	return [
		[live.CENTRES.refeitorio+Vector3(0,0,3),"Uma caneca de água sabe bem.",4.0],
		[live.CENTRES.escrivaes+Vector3(-5.8,0,0),"Deixa entrar a brisa do Tejo.",5.0],
		[live.CENTRES.tesouraria+Vector3(0,0,-3),"Vou espreitar estes registos.",4.0],
		[live.CENTRES.gabinete+Vector3(3.6,0,1.8),"Um momento à janela.",7.0]]

func start_errand(a: Dictionary, index: int) -> void:
	if a.break_stage != "" or index in errands: return
	errands[index] = a.live_id
	a.errand = index
	start_leg(a,"errand",errand_spots()[index][0])

func quip(a: Dictionary) -> void:
	var lines := ["Quem ficou com a minha caneca?","Só mais cinco minutos.","Esta pausa veio mesmo a calhar."]
	if live.definition.ID == "tasca": lines.append("O café hoje está no ponto.")
	else: lines.append("Já chegaram notícias da armada?")
	say(a,lines[rng.randi_range(0,lines.size()-1)],rng.randf_range(4,8))

func pair_chat(a: Dictionary) -> void:
	if a.partner != "" or not live.break_places.has(a.live_id): return
	var partner_place: int = int(live.break_places[a.live_id]) ^ 1
	for id in live.break_places:
		var other: Dictionary = live.agents[id]
		if live.break_places[id] == partner_place and other.break_stage == "chat" and other.partner == "":
			a.partner = id
			other.partner = a.live_id
			a.chat_owner = true
			a.chat_index = 0
			a.chat_time = 0.0
			return

func finish_break(a: Dictionary) -> void:
	cancel(a)
	if a.cup:
		var next := "brew" if rng.randf()<0.6 else "wash"
		start_leg(a,next,coffee_position(next))
	elif not a.cup_home and rng.randf()<0.75:
		start_leg(a,"tray",coffee_position("tray"))

func tick(a: Dictionary, delta: float) -> void:
	if a.social_time > 0: a.social_time = maxf(0,a.social_time-delta)
	a.aura_time = maxf(0,a.aura_time-delta)
	a.cheer_time = maxf(0,a.cheer_time-delta)
	if a.state in BUSY: a.busy_time += delta
	a.cup_node.visible = a.cup
	if a.cup and a.break_stage == "" and a.node.position.distance_to(live.navigation.stand(a.home))<0.15:
		a.cup = false
		a.cup_home = true
	if a.state not in FREE or not a.has_seat: return
	if a.break_stage == "":
		if a.is_god: return
		a.roam_time -= delta
		if a.roam_time <= 0 and a.node.position.distance_to(a.destination)<0.15:
			roam(a)
			a.roam_time = rng.randf_range(3,7)
		return
	if a.node.position.distance_to(a.destination) >= 0.15:
		a.walk_time += delta
		# 3D rooms are much farther apart than the original tiled office.
		if a.walk_time > 90:
			cancel(a)
			live.move_to(a,a.home)
		return
	if not a.arrived:
		a.arrived = true
		a.phase_time = 0.0
		match a.break_stage:
			"table":
				a.break_stage = "chat"
				a.pause_length = rng.randf_range(8,16)
				quip(a)
				pair_chat(a)
			"tray":
				if clean_cups == 0:
					say(a,"Não há canecas limpas.")
					a.break_stage = ""
					return
				clean_cups -= 1
				a.cup = true
			"brew": say(a,"A preparar a minha caneca.")
			"wash": say(a,"Vou lavar a caneca.")
			"rack":
				a.cup = false
				clean_cups = mini(8,clean_cups+1)
			"errand": say(a,errand_spots()[a.errand][1],errand_spots()[a.errand][2])
	a.phase_time += delta
	match a.break_stage:
		"chat":
			if a.chat_owner and live.agents.has(a.partner):
				a.chat_time -= delta
				if a.chat_time <= 0:
					var lines := ["Aceitas uma pausa?","Só se houver uma caneca limpa.","Essa é a parte difícil!","Então ficamos pela conversa."]
					if a.chat_index < lines.size():
						var speaker: Dictionary = a if a.chat_index%2==0 else live.agents[a.partner]
						say(speaker,lines[a.chat_index],2.4)
						a.chat_index += 1
						a.chat_time = 2.4
						a.phase_time = minf(a.phase_time,a.pause_length-3.5)
						var other: Dictionary = live.agents[a.partner]
						other.phase_time = minf(other.phase_time,other.pause_length-3.5)
					else:
						live.agents[a.partner].partner = ""
						a.partner = ""
						a.chat_owner = false
			elif a.partner == "" and a.social_time <= 0:
				quip(a)
				pair_chat(a)
			if a.phase_time >= a.pause_length: finish_break(a)
		"tray":
			if a.phase_time>=0.8: start_leg(a,"brew",coffee_position("brew"))
		"brew":
			if a.phase_time>=2.6: start_leg(a,"return",a.home)
		"wash":
			if a.phase_time>=2.4: start_leg(a,"rack",coffee_position("rack"))
		"rack":
			if a.phase_time>=0.6: a.break_stage = ""
		"return":
			a.cup = false
			a.cup_home = true
			a.break_stage = ""
			a.roam_time = 6.0
		"errand":
			if a.phase_time>=errand_spots()[a.errand][2]:
				cancel(a)
				if a.is_god: live.move_to(a,a.home)

func update(delta: float) -> void:
	cafe_cooldown -= delta
	errand_cooldown -= delta
	var candidates: Array = []
	for a in live.agents.values():
		if eligible(a): candidates.append(a)
	if cafe_cooldown <= 0:
		cafe_cooldown = rng.randf_range(6,12)
		if not candidates.is_empty() and rng.randf()<0.7:
			start_break(candidates[rng.randi_range(0,candidates.size()-1)])
	if errand_cooldown <= 0:
		errand_cooldown = rng.randf_range(10,20)
		var index := rng.randi_range(0,errand_spots().size()-1)
		if index == 3:
			for a in live.agents.values():
				if a.is_god and a.has_seat and a.state in FREE: start_errand(a,index)
		elif not candidates.is_empty(): start_errand(candidates[rng.randi_range(0,candidates.size()-1)],index)

	# Cosmetic boss-proximity chatter, using the actual completed-task count.
	var boss: Dictionary = {}
	for a in live.agents.values():
		if a.is_god: boss = a; break
	if not boss.is_empty():
		for a in candidates:
			if eligible(a) and a.aura_time<=0 and a.node.position.distance_to(boss.node.position)<2.2:
				a.aura_time = 35.0
				var count: int = done_counts.get(a.live_id,0)
				say(a,"Já terminei %d tarefas!"%count if count>0 else "Estou por aqui, se precisares.",4.0,"Conversa")
