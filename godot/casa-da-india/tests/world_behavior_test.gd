extends SceneTree
var failures := 0

func _initialize() -> void:
	call_deferred("run")

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		printerr("FAIL: ",message)

func run() -> void:
	for scenario in ["casadaindia","tasca"]:
		var scene = load("res://scenes/casa.tscn").instantiate()
		scene.scenario = scenario
		root.add_child(scene)
		await process_frame
		var live = scene.live_world
		if not is_instance_valid(live):
			live = load("res://scripts/live_world.gd").new()
			scene.add_child(live)
			scene.live_world = live
		live.life.rng.seed = 42
		for spot in live.life.errand_spots():
			check(not live.navigation.route(Vector3(0,0,8),spot[0]).is_empty(),"Errand remains reachable in "+scenario)
		for phase in ["tray","brew","wash","rack"]:
			check(not live.navigation.route(Vector3(0,0,8),live.life.coffee_position(phase)).is_empty(),"Coffee fixture remains reachable")
		var roster: Array = [
			{"id":"boss","name":"Chefe","character":"lourenco","isGod":true,"seat":0,"status":"idle"},
			{"id":"worker","name":"António","character":"caminha","seat":1,"status":"working","action":"Read README.md","carrying":"Read"},
			{"id":"partner","name":"Rosa","character":"caminha","seat":2,"status":"idle"},
			{"id":"overflow","name":"Sem lugar","character":"caminha","seat":null,"status":"idle"}]
		var snapshot := {"version":2,"type":"snapshot","scenario":scenario,"room":live.definition.OVERVIEW,"visible":true,"agents":roster}
		live.apply_snapshot(snapshot)
		var a: Dictionary = live.agents.worker
		var boss: Dictionary = live.agents.boss
		var partner: Dictionary = live.agents.partner
		var home: Vector3 = live.navigation.stand(a.home)
		var identity: int = a.node.get_instance_id()
		for tool in ["shelf","web","mcp","terminal","board","mailbox"]:
			roster[1].station = tool
			live.apply_snapshot(snapshot)
			check(a.destination.is_equal_approx(home),scenario+": tools stay at workstation")
		check(live.life.activity(a)=="Read README.md","Real action is shown")
		live.bubbles.update_bubbles(live.agents,scene.camera,live.life)
		check(live.bubbles.cards.worker.text.text.contains("Read README.md"),"Unselected agent has activity cloud")
		roster[1].action = ""
		roster[1].lastPrompt = "Explica como funciona este projeto em detalhe"
		live.apply_snapshot(snapshot)
		check(live.life.activity(a).begins_with("Explica como funciona"),"Prompt fallback")
		roster[1].status = "idle"
		live.apply_snapshot(snapshot)
		live.tick(a,0.1)
		check(not a.destination.is_equal_approx(home),"Idle worker wanders")
		var wandering: Vector3 = a.destination
		live.apply_snapshot(snapshot)
		check(a.destination==wandering,"Polling does not reset wandering")
		live.tick(boss,40)
		check(boss.destination==live.navigation.stand(boss.home),"Idle boss stays at workstation")
		live.life.start_break(boss)
		live.life.start_break(live.agents.overflow)
		check(live.break_places.is_empty(),"Boss and overflow cannot take worker breaks")
		live.life.start_break(a)
		check(a.break_stage=="table","Worker heads to cafeteria table")
		live.tick(a,10)
		check(a.break_stage=="table" and a.phase_time==0,"Pause time starts on arrival")
		a.node.position = a.destination
		live.tick(a,0.01)
		check(a.break_stage=="chat","Arriving starts a pause")
		live.break_places.partner = int(live.break_places.worker)^1
		live.life.start_leg(partner,"table",live.definition.break_position("eat",live.break_places.partner))
		partner.node.position = partner.destination
		live.tick(partner,0.01)
		check(partner.partner=="worker" and a.partner=="partner","Tablemates converse")
		roster[1].status = "working"
		live.apply_snapshot(snapshot)
		check(a.break_stage=="" and a.partner=="" and partner.partner=="","Work cancels pause and conversation")
		check(not live.break_places.has("worker") and a.destination==home,"Seat freed and worker returns home")
		roster[1].status = "idle"
		live.apply_snapshot(snapshot)
		live.life.start_leg(a,"tray",live.life.coffee_position("tray"))
		for phase in ["tray","brew","return"]:
			check(a.break_stage==phase,"Coffee sequence: "+phase)
			a.node.position = a.destination
			live.tick(a,3.0)
		check(a.cup_home and not a.cup and live.life.clean_cups==7,"Brewed mug returns to desk")
		a.cup_home = false
		a.cup = true
		live.life.start_leg(a,"wash",live.life.coffee_position("wash"))
		for phase in ["wash","rack"]:
			a.node.position = a.destination
			live.tick(a,3.0)
		check(not a.cup and live.life.clean_cups==8,"Washing restores clean mug supply")
		roster[1].status = "blocked"
		live.apply_snapshot(snapshot)
		check(a.destination==live.navigation.stand(live.definition.blocked_position(1)),"Blocked worker goes to entrance")
		roster[1].status = "ghost"
		live.apply_snapshot(snapshot)
		check(a.destination==a.node.position and live.life.activity(a)=="","Disconnected worker freezes, bubble hidden")
		roster[1].status = "working"
		live.apply_snapshot(snapshot)
		live.tick(a,61)
		roster[1].status = "idle"
		live.apply_snapshot(snapshot)
		check(a.cheer_time>0,"Only substantial completed work earns celebration")
		roster[1].status = "working"
		live.apply_snapshot(snapshot)
		live.tick(a,1)
		roster[1].status = "idle"
		live.apply_snapshot(snapshot)
		check(a.cheer_time==0,"Short inbox turns do not celebrate")
		live.life.start_errand(a,0)
		check(live.life.errands.has(0),"Idle errand reserves its fixture")
		roster[1].status = "waiting"
		live.apply_snapshot(snapshot)
		check(not live.life.errands.has(0) and a.destination==home,"Waiting cancels errand and stays at workstation")
		snapshot.visible = false
		live.apply_snapshot(snapshot)
		var cooldown: float = live.life.cafe_cooldown
		live._process(30)
		check(live.life.cafe_cooldown==cooldown,"Hidden scene suspends autonomous director")
		snapshot.visible = true
		check(a.node.get_instance_id()==identity,"State changes retain character identity")
		roster.pop_at(2)
		live.apply_snapshot(snapshot)
		check(not live.agents.has("partner") and not live.bubbles.cards.has("partner"),"Removal clears actor and cloud")
		scene.queue_free()
		await process_frame
	print("BEHAVIOUR: both scenarios; workstation, activity clouds, wandering, breaks, chat, coffee, interruption, identity; failures: ",failures)
	quit(1 if failures else 0)
