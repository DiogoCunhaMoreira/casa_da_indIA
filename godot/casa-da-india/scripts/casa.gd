@tool
extends Node3D
## Maquete independente. Geometria original construída no editor e em execução.

const CREAM = Color("e8d9ba")
const WOOD = Color("78503d")
const GOLD = Color("c69b59")
const INK = Color("294954")
@export var gabinete := false
@export var escrivaes := false
@export var conselho := false
@export var cartografia := false
@export var tesouraria := false
@export var refeitorio := false
var live_world: Node
var material_cache: Dictionary = {}
var plan_rooms: Array[Dictionary] = []
var plan_walls_cut: Node3D
var plan_walls_full: Node3D
var full_walls := true
var walls_button: Button
var camera: Camera3D
var officials: Array[Dictionary] = []
var info: Label
var paused := false
var elapsed := 0.0
var selected := -1
var orbit := 0.0
var camera_focus := Vector3(0,0.2,0.5)

func material(color: Color) -> StandardMaterial3D:
	if material_cache.has(color):
		return material_cache[color]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.88
	material_cache[color] = m
	return m

func box(parent: Node3D, title: String, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = title
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.material_override = material(color)
	parent.add_child(node)
	node.position = pos
	return node

func round_shape(parent: Node3D, title: String, pos: Vector3, radius: float, height: float, color: Color, top: float = -1.0) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = title
	var mesh := CylinderMesh.new()
	mesh.bottom_radius = radius
	mesh.top_radius = radius if top < 0.0 else top
	mesh.height = height
	mesh.radial_segments = 12
	node.mesh = mesh
	node.material_override = material(color)
	parent.add_child(node)
	node.position = pos
	return node

func ball(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radial_segments = 16
	mesh.rings = 8
	node.mesh = mesh
	node.material_override = material(color)
	parent.add_child(node)
	node.position = pos
	node.scale = size
	return node

func _ready() -> void:
	var world := Node3D.new()
	world.name = "Maquete"
	add_child(world)
	var env := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color("b8ced0")
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color("fff1d7")
	settings.ambient_light_energy = 0.38
	settings.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	env.environment = settings
	world.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -35, 0)
	sun.light_color = Color("fff0d6")
	sun.light_energy = 0.85
	sun.shadow_enabled = true
	# Uma maquete compacta não precisa de cascatas para grandes distâncias.
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 95.0
	sun.directional_shadow_pancake_size = 0.0
	sun.shadow_bias = 0.2
	sun.shadow_normal_bias = 1.0
	world.add_child(sun)
	var backdrop := box(world, "Fundo", Vector3(0,-0.85,0), Vector3(200,0.2,200), Color("b8ced0"))
	backdrop.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if refeitorio:
		preload("res://scripts/refeitorio.gd").new().build(self, world)
		make_official(world,"Tomé Pires","Em pausa",Color("73844b"),[Vector3(-1.0,0,0.4),Vector3(-0.5,0,0.4),Vector3(-0.5,0,-2.55),Vector3(-0.5,0,0.4)],0)
		make_official(world,"Duarte Barbosa","Em pausa",Color("487b80"),[Vector3(2.5,0,2.3),Vector3(1.1,0,2.3),Vector3(1.1,0,-2.55),Vector3(1.1,0,2.3)],1)
		officials[0].home_facing = -PI/2
		officials[0].facing = -PI/2
		officials[0].node.rotation.y = -PI/2
		camera_focus = Vector3(0,0.8,0)
	elif tesouraria:
		preload("res://scripts/tesouraria.gd").new().build(self, world)
		make_official(world,"Fernão Lourenço","Feitor e tesoureiro",Color("9b5149"),[Vector3(-0.7,0,1.25),Vector3(-0.7,0,2.5),Vector3(2.4,0,2.5),Vector3(-0.7,0,2.5)],0)
		make_official(world,"Pêro Vaz de Caminha","Escrivão",Color("487b80"),[Vector3(5.35,0,1.55),Vector3(4.0,0,1.55),Vector3(4.0,0,3),Vector3(4.0,0,1.55)],1)
		camera_focus = Vector3(0,0.8,0)
	elif cartografia:
		preload("res://scripts/cartografia.gd").new().build(self, world)
		make_official(world,"Francisco Rodrigues","Cartógrafo",Color("487b80"),[Vector3(-0.4,0,1.9),Vector3(-0.4,0,2.65),Vector3(2.2,0,2.65),Vector3(-0.4,0,2.65)],0)
		make_official(world,"Rui Faleiro","Cosmógrafo",Color("73844b"),[Vector3(4.75,0,-0.35),Vector3(3.15,0,-0.35),Vector3(3.15,0,1.4),Vector3(3.15,0,-0.35)],1)
		camera_focus = Vector3(0,0.8,0)
	elif conselho:
		preload("res://scripts/conselho.gd").new().build(self, world)
		make_official(world,"Fernão Lourenço","Feitor",Color("9b5149"),[Vector3(-4.25,0,0),Vector3(-5.2,0,0),Vector3(-5.2,0,2.7),Vector3(-5.2,0,0)],0)
		make_official(world,"Pêro Vaz de Caminha","Escrivão",Color("487b80"),[Vector3(4.25,0,0.2),Vector3(5.3,0,0.2),Vector3(5.3,0,2.7),Vector3(5.3,0,0.2)],1)
		for i in range(2):
			officials[i].home_facing = PI/2 if i == 0 else -PI/2
			officials[i].facing = officials[i].home_facing
			officials[i].node.rotation.y = officials[i].home_facing
		camera_focus = Vector3(0,0.8,0)
	elif escrivaes:
		preload("res://scripts/escrivaes.gd").new().build(self, world)
		var names := ["Pêro Vaz de Caminha", "Tomé Pires", "Duarte Barbosa"]
		for i in range(3):
			var x := -4.5+i*4.5
			make_official(world,names[i],"Escrivão",[Color("487b80"),Color("73844b"),Color("9b5149")][i],[Vector3(x,0,2.5),Vector3(x+1.6,0,2.5),Vector3(x+1.6,0,3.7),Vector3(x,0,3.7),Vector3(x+1.6,0,3.7),Vector3(x+1.6,0,2.5)],i)
		camera_focus = Vector3(0,0.8,0)
	elif gabinete:
		preload("res://scripts/gabinete.gd").new().build(self, world)
		make_official(world,"Fernão Lourenço","Feitor",Color("9b5149"),[Vector3(0,0,-2.6),Vector3(2.8,0,-2.6),Vector3(2.8,0,2.7),Vector3(0,0,2.7),Vector3(2.8,0,2.7),Vector3(2.8,0,-2.6)],0)
		officials[0].node.rotation.y = 0.0
		officials[0].facing = 0.0
		camera_focus = Vector3(0,0.8,0)
	else:
		build_layout(world)
		camera_focus = Vector3(0,0.2,2.5)
		make_official(world,"Fernão Lourenço","Feitor",Color("9b5149"),[Vector3(-0.65,0,-8.3),Vector3(-0.65,0,2.7),Vector3(-0.65,0,13.7),Vector3(-0.65,0,2.7)],0)
		make_official(world,"Pêro Vaz de Caminha","Escrivão",Color("487b80"),[Vector3(0.65,0,13.7),Vector3(0.65,0,2.7),Vector3(0.65,0,-8.3),Vector3(0.65,0,2.7)],1)
	camera = Camera3D.new()
	camera.name = "CameraDaMaquete"
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 18.8 if gabinete or escrivaes or conselho or cartografia or tesouraria or refeitorio else 49.0
	camera.near = 5.0
	camera.far = 95.0
	world.add_child(camera)
	update_camera()
	camera.current = true
	if not Engine.is_editor_hint():
		make_ui()
		if OS.has_feature("web"):
			live_world = preload("res://scripts/live_world.gd").new()
			add_child(live_world)
		if "--capture" in OS.get_cmdline_user_args():
			capture_preview()

func desk(parent: Node3D, p: Vector3) -> void:
	box(parent,"Tampo",p+Vector3(0,0.92,0),Vector3(2.3,0.18,1),WOOD)
	for x in [-0.95,0.95]:
		for z in [-0.34,0.34]:
			box(parent,"PernaMesa",p+Vector3(x,0.44,z),Vector3(0.14,0.88,0.14),WOOD)
	for i in range(3):
		var paper := box(parent,"Pergaminho",p+Vector3(-0.45+i*0.36,1.02,0.03),Vector3(0.46,0.015,0.55),Color("f6e8c5"))
		paper.rotation.y = i*0.2-0.15
	round_shape(parent,"Tinteiro",p+Vector3(0.8,1.08,-0.2),0.09,0.13,INK)
	var quill := box(parent,"Pena",p+Vector3(0.8,1.28,-0.2),Vector3(0.03,0.35,0.07),CREAM)
	quill.rotation.z = -0.3

func shelf(parent: Node3D, p: Vector3) -> void:
	box(parent,"FundoArquivo",p+Vector3(0,1.2,0),Vector3(1.8,2.4,0.25),WOOD)
	for y in [0.15,0.8,1.45,2.1]:
		box(parent,"Prateleira",p+Vector3(0,y,0.18),Vector3(1.9,0.12,0.6),WOOD)
		for i in range(6):
			box(parent,"Livro",p+Vector3(-0.72+i*0.27,y+0.25,0.2),Vector3(0.18,0.38+float(i%2)*0.08,0.34),[Color("607d77"),Color("a76850"),GOLD][i%3])

func barrel(parent: Node3D, p: Vector3) -> void:
	round_shape(parent,"Barril",p+Vector3(0,0.48,0),0.39,0.9,GOLD)
	for y in [0.2,0.72]:
		round_shape(parent,"Aro",p+Vector3(0,y,0),0.405,0.07,INK)

func pivot(parent: Node3D, title: String, pos: Vector3) -> Node3D:
	var n := Node3D.new()
	n.name = title
	parent.add_child(n)
	n.position = pos
	return n

func make_official(parent: Node3D, title: String, role: String, color: Color, route: Array, index: int, appearance: Dictionary = {}) -> void:
	var actor := pivot(parent,title,route[0])
	actor.rotation.y = PI
	var body := pivot(actor,"Corpo",Vector3.ZERO)
	var skin: Color = Color(appearance.get("skin", ["efbd96","e6ae87","d99e76"][index%3]))
	var hair: Color = Color(appearance.get("hair", ["554139","755340","3e3534"][index%3]))
	# Cabeça generosa, bochechas e roupa com volumes suaves.
	ball(body,Vector3(0,0.83,0),Vector3(0.66,0.71,0.43),color)
	ball(body,Vector3(0,0.56,0),Vector3(0.65,0.25,0.45),color.darkened(0.08))
	for side in [-1.0,1.0]:
		var collar := ball(body,Vector3(side*0.105,1.08,0.18),Vector3(0.19,0.12,0.12),CREAM)
		collar.rotation.z = side*0.3
	for y in [0.71,0.85,0.98]:
		ball(body,Vector3(0,y,0.225),Vector3(0.05,0.05,0.028),GOLD)
	var head := pivot(body,"Cabeca",Vector3(0,1.39,0))
	ball(head,Vector3(0,0.02,-0.035),Vector3(0.79,0.78,0.68),hair)
	ball(head,Vector3(0,-0.025,0.06),Vector3(0.73,0.69,0.63),skin)
	for side in [-1.0,1.0]:
		ball(head,Vector3(side*0.365,-0.02,0.02),Vector3(0.13,0.19,0.14),skin)
		ball(head,Vector3(side*0.21,-0.10,0.315),Vector3(0.16,0.075,0.025),skin.lerp(Color("d67e72"),0.35))
	var eyes: Array[Node3D] = []
	for x in [-0.135,0.135]:
		var eye := ball(head,Vector3(x,0.015,0.355),Vector3(0.065,0.105,0.035),INK.darkened(0.45))
		eyes.append(eye)
		ball(head,Vector3(x-0.012,0.036,0.374),Vector3(0.018,0.021,0.009),Color.WHITE)
		var brow := ball(head,Vector3(x,0.12,0.33),Vector3(0.1,0.027,0.035),hair)
		brow.rotation.z = -x*0.5
	ball(head,Vector3(0,-0.065,0.375),Vector3(0.115,0.10,0.10),skin.lightened(0.035))
	ball(head,Vector3(0,-0.18,0.343),Vector3(0.105,0.026,0.018),Color("a36b57"))
	if appearance.get("beard", "bigode" if index == 0 else "") == "bigode":
		for side in [-1.0,1.0]:
			var moustache := ball(head,Vector3(side*0.065,-0.125,0.365),Vector3(0.145,0.055,0.045),hair)
			moustache.rotation.z = side*0.22
	if appearance.get("beard", "curta" if index == 1 else "") in ["curta","cheia","bifurcada","longa"]:
		ball(head,Vector3(0,-0.26,0.24),Vector3(0.36,0.19,0.2),hair)
	for i in range(4):
		ball(head,Vector3(-0.24+i*0.15,0.25-abs(i-1.0)*0.025,0.21),Vector3(0.24,0.19,0.2),hair)
	var hat := pivot(head,"Boina",Vector3(0,0.32,-0.02))
	hat.rotation.z = -0.12+index*0.1
	ball(hat,Vector3.ZERO,Vector3(0.86,0.20,0.73),color.darkened(0.25))
	ball(hat,Vector3(-0.06,0.095,0),Vector3(0.7,0.23,0.58),color)
	ball(hat,Vector3(0.23,0.04,0.28),Vector3(0.09,0.10,0.045),GOLD)
	var hat_style: String = appearance.get("hat", "barrete")
	hat.visible = hat_style != "nenhuma"
	if hat_style == "chapeuAba":
		round_shape(hat,"Aba",Vector3(0,-0.06,0),0.61,0.045,color.darkened(0.25))
	elif hat_style in ["toucado","coifa"]:
		ball(head,Vector3(0,0,-0.22),Vector3(0.86,0.95,0.45),CREAM)
	elif hat_style == "elmo":
		for part in hat.get_children():
			if part is MeshInstance3D:
				part.material_override = material(Color("9aa3ab"))
	if appearance.get("cape", "nenhuma") != "nenhuma":
		ball(body,Vector3(0,0.67,-0.24),Vector3(0.79,0.88,0.19),Color(appearance.get("capeColor", "78503d")))
	var arms: Array[Node3D] = []
	var elbows: Array[Node3D] = []
	var legs: Array[Node3D] = []
	var knees: Array[Node3D] = []
	for side in [-1.0,1.0]:
		var shoulder := pivot(body,"Ombro",Vector3(side*0.32,1.0,0))
		ball(shoulder,Vector3(side*0.025,-0.12,0),Vector3(0.24,0.35,0.27),color)
		var elbow := pivot(shoulder,"Cotovelo",Vector3(side*0.025,-0.25,0))
		ball(elbow,Vector3(0,-0.07,0),Vector3(0.17,0.23,0.19),color.lightened(0.06))
		ball(elbow,Vector3(0,-0.20,0.015),Vector3(0.17,0.19,0.18),skin)
		arms.append(shoulder)
		elbows.append(elbow)
		var hip := pivot(body,"Anca",Vector3(side*0.17,0.55,0))
		ball(hip,Vector3(0,-0.12,0),Vector3(0.23,0.34,0.25),color.darkened(0.35))
		var knee := pivot(hip,"Joelho",Vector3(0,-0.24,0))
		ball(knee,Vector3(0,-0.07,0),Vector3(0.19,0.24,0.20),Color("51423b"))
		ball(knee,Vector3(0,-0.16,0.065),Vector3(0.23,0.16,0.37),Color("453b38"))
		legs.append(hip)
		knees.append(knee)
	var ring := round_shape(actor,"Selecao",Vector3(0,0.085,0),0.48,0.015,Color("e3be71"))
	ring.visible = false
	var label := Label3D.new()
	label.text = title
	label.font_size = 34
	label.pixel_size = 0.006
	label.position.y = 2.12
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.modulate = Color("fff3d7")
	label.outline_modulate = INK
	label.visible = false
	actor.add_child(label)
	officials.append({"node":actor,"body":body,"head":head,"arms":arms,"elbows":elbows,"legs":legs,"knees":knees,"eyes":eyes,"label":label,"ring":ring,"name":title,"role":role,"route":route,"target":1,"wait":3.0+index*1.7,"state":"A trabalhar","speed":0.0,"phase":index*1.9,"blend":0.0,"index":index,"facing":PI})

func advance_live(a: Dictionary, delta: float) -> float:
	var actor: Node3D = a.node
	if a.wait > 0.0:
		a.speed = move_toward(float(a.speed),0.0,delta*2.4)
		return 0.0
	var remaining: float = actor.position.distance_to(a.route[a.target])
	for i in range(int(a.target),a.route.size()-1):
		remaining += a.route[i].distance_to(a.route[i+1])
	# Brake for the final destination, never for each 25 cm navigation cell.
	var desired := minf(1.15,sqrt(2.0*2.4*remaining))
	a.speed = move_toward(float(a.speed),desired,delta*2.4)
	var budget: float = a.speed*delta
	var travelled := 0.0
	var start: Vector3 = actor.position
	while a.wait <= 0.0:
		var direction: Vector3 = a.route[a.target]-actor.position
		var length := direction.length()
		if length > budget and length > 0.00001:
			actor.position += direction/length*budget
			travelled += budget
			break
		actor.position = a.route[a.target]
		budget -= length
		travelled += length
		if int(a.target)+1 < a.route.size():
			a.target += 1
		else:
			a.wait = 3600.0
			a.speed = 0.0
			break
	var motion: Vector3 = actor.position-start
	if motion.length_squared() > 0.000001:
		a.facing = atan2(motion.x,motion.z)
	actor.rotation.y = lerp_angle(actor.rotation.y,float(a.facing),1.0-exp(-delta*8.0))
	return travelled

func animate_official(a: Dictionary, delta: float) -> void:
	var actor: Node3D = a.node
	var distance := 0.0
	if a.has("live_id"):
		distance = advance_live(a,delta)
	else:
		var direction: Vector3 = a.route[a.target]-actor.position
		var desired_speed := 0.0
		if a.wait > 0.0:
			a.wait = maxf(0.0,a.wait-delta)
			if refeitorio:
				a.state = "À mesa" if a.target == 1 else ("Junto ao balcão" if a.target == 3 else "Em pausa")
			else:
				a.state = ("A estudar cartas" if cartografia else ("Em reunião" if conselho else "A trabalhar")) if a.target == 1 else "A consultar registos"
		else:
			if direction.length() < 0.025:
				actor.position = a.route[a.target]
				a.target = (int(a.target)+1)%a.route.size()
				a.wait = 3.8+float(a.index)*0.8
				a.facing = float(a.get("home_facing", 0.0 if gabinete else PI)) if a.target == 1 else actor.rotation.y+0.45
			else:
				a.facing = atan2(direction.x,direction.z)
				# Travar antes da paragem e começar só depois de virar o corpo.
				var facing_error := absf(wrapf(float(a.facing)-actor.rotation.y,-PI,PI))
				desired_speed = minf(0.88+float(a.index)*0.06,sqrt(2.0*1.7*direction.length()))
				desired_speed *= clampf(1.0-facing_error/1.8,0.0,1.0)
				a.state = "A circular"
		a.speed = move_toward(float(a.speed),desired_speed,delta*1.7)
		actor.rotation.y = lerp_angle(actor.rotation.y,float(a.facing),1.0-exp(-delta*5.0))
		distance = minf(float(a.speed)*delta,direction.length()) if a.wait <= 0.0 else 0.0
		if distance > 0.0:
			actor.position += direction.normalized()*distance
	a.phase += distance*TAU/(1.0 if a.has("live_id") else 0.72)
	a.blend = move_toward(float(a.blend),clampf(float(a.speed)/0.65,0,1),delta*4.0)
	var stride: float = a.phase
	var blend: float = a.blend
	var idle := elapsed+float(a.index)*2.3
	var body: Node3D = a.body
	body.position.y = 0.015 + (1.0-cos(stride*2.0))*0.013*blend+sin(idle*1.8)*0.007*(1.0-blend)
	body.rotation.z = sin(stride)*0.035*blend
	body.rotation.x = -0.035*blend
	a.head.rotation.y = sin(idle*0.65)*0.1*(1.0-blend)
	a.head.rotation.z = -body.rotation.z*0.65
	var working: float = (1.0-blend) if a.target == 1 and not refeitorio else 0.0
	if a.has("live_id"):
		working = (1.0-blend) if a.get("live_working", false) else 0.0
	for i in range(2):
		var cycle := stride+float(i)*PI
		a.legs[i].rotation.x = sin(cycle)*0.42*blend
		a.knees[i].rotation.x = -maxf(0.0,cos(cycle))*0.62*blend
		a.arms[i].rotation.x = -sin(cycle)*0.27*blend-0.48*working
		a.arms[i].rotation.z = (-0.08 if i == 0 else 0.08)
		a.elbows[i].rotation.x = -0.16-0.25*working+sin(idle*3.2+i)*0.08*working
		var blink := fmod(idle,4.1) < 0.13
		a.eyes[i].scale.y = 0.012 if blink else 0.105

func update_camera() -> void:
	camera.position = camera_focus + Vector3(sin(orbit+0.23)*22,19 if gabinete or escrivaes or conselho or cartografia or tesouraria or refeitorio else 27,cos(orbit+0.23)*22)
	camera.look_at(camera_focus)

func make_ui() -> void:
	if OS.has_feature("web"):
		var live_layer := CanvasLayer.new()
		add_child(live_layer)
		info = Label.new()
		info.position = Vector2(20,20)
		info.add_theme_color_override("font_color", INK)
		live_layer.add_child(info)
		return
	var layer := CanvasLayer.new()
	add_child(layer)
	var panel := PanelContainer.new()
	panel.position = Vector2(28,750) if gabinete or escrivaes or conselho or cartografia or tesouraria or refeitorio else Vector2(28,750)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("243e48")
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	style.content_margin_left = 22
	style.content_margin_right = 22
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel",style)
	layer.add_child(panel)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation",8)
	panel.add_child(stack)
	var title := Label.new()
	title.text = "CASA DA ÍNDIA"
	title.add_theme_font_size_override("font_size",26)
	stack.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "Refeitório e Adega · Pausa dos oficiais" if refeitorio else "Tesouraria e Contabilidade · Receitas e valores" if tesouraria else "Cartografia e Roteiros · Cartas e navegação" if cartografia else "Sala do Conselho · Roteiros e decisões" if conselho else "Sala dos Escrivães · Registos e correspondência" if escrivaes else ("Gabinete do Feitor · Estudo de interior" if gabinete else "Planta geral · Seis salas e cais")
	subtitle.modulate = Color("e4c28c")
	stack.add_child(subtitle)
	info = Label.new()
	info.text = "Dois oficiais · pausa simulada" if refeitorio else "Dois oficiais · contabilidade simulada" if tesouraria else "Dois oficiais · estudo de cartas simulado" if cartografia else ("Seis lugares · dois oficiais · reunião simulada" if conselho else ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Clica numa sala para abrir o interior detalhado.")))
	stack.add_child(info)
	var controls := Label.new()
	controls.text = "Roda / + −: zoom · Arrastar botão direito: mover · F: focar · R: repor · F11: ecrã completo"
	controls.position = Vector2(28,910)
	controls.add_theme_color_override("font_color",INK)
	layer.add_child(controls)
	var rooms := HBoxContainer.new()
	rooms.position = Vector2(28,26)
	rooms.add_theme_constant_override("separation",10)
	layer.add_child(rooms)
	for entry in [["Gabinete", "gabinete"], ["Escrivães", "escrivaes"], ["Conselho", "conselho"], ["Cartografia", "cartografia"], ["Tesouraria", "tesouraria"], ["Refeitório", "refeitorio"], ["Planta", "casa"]]:
		var button := Button.new()
		button.text = entry[0]
		button.custom_minimum_size = Vector2(125,40)
		button.disabled = (entry[1] == "gabinete" and gabinete) or (entry[1] == "escrivaes" and escrivaes) or (entry[1] == "conselho" and conselho) or (entry[1] == "cartografia" and cartografia) or (entry[1] == "tesouraria" and tesouraria) or (entry[1] == "refeitorio" and refeitorio) or (entry[1] == "casa" and not gabinete and not escrivaes and not conselho and not cartografia and not tesouraria and not refeitorio)
		button.pressed.connect(switch_room.bind(entry[1]))
		rooms.add_child(button)

	if not plan_rooms.is_empty():
		walls_button = Button.new()
		walls_button.position = Vector2(28,78)
		walls_button.custom_minimum_size = Vector2(330,40)
		walls_button.pressed.connect(toggle_plan_walls)
		layer.add_child(walls_button)
		set_plan_walls(full_walls)

func toggle_plan_walls() -> void:
	set_plan_walls(not full_walls)

func set_plan_walls(complete: bool) -> void:
	full_walls = complete
	if is_instance_valid(plan_walls_cut):
		plan_walls_cut.visible = not complete
	if is_instance_valid(plan_walls_full):
		plan_walls_full.visible = complete
	if is_instance_valid(walls_button):
		walls_button.text = "Paredes completas · Ver em corte" if complete else "Paredes em corte · Ver completas"

func switch_room(room_name: String) -> void:
	if is_instance_valid(live_world):
		live_world.view_room(room_name)
		return
	if "--capture" in OS.get_cmdline_user_args():
		return
	get_tree().change_scene_to_file("res://scenes/%s.tscn" % room_name)

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	var turn := float(Input.is_physical_key_pressed(KEY_RIGHT))-float(Input.is_physical_key_pressed(KEY_LEFT))
	if turn != 0.0:
		orbit = clampf(orbit+turn*delta, -0.45,0.75)
		update_camera()
	if paused:
		return
	elapsed += delta
	for a in officials:
		if is_instance_valid(live_world):
			live_world.tick(a,delta)
		var live_state: String = a.state
		animate_official(a,delta)
		if a.has("live_id"):
			a.state = live_state
	if selected >= 0:
		var a := officials[selected]
		info.text = "%s · %s\n%s" % [a.name,a.role,a.get("caption",a.state)]

func zoom_camera(factor: float) -> void:
	camera.size = clampf(camera.size * factor, 2.5, 60.0)

func _unhandled_input(event: InputEvent) -> void:
	if Engine.is_editor_hint():
		return
	if event is InputEventMagnifyGesture:
		zoom_camera(1.0 / maxf(event.factor, 0.01))
	elif event is InputEventPanGesture:
		zoom_camera(exp(event.delta.y * 0.025))
	elif event is InputEventMouseMotion and (event.button_mask & MOUSE_BUTTON_MASK_RIGHT):
		var scale_per_pixel := camera.size / get_viewport().get_visible_rect().size.y
		camera_focus += (-camera.global_basis.x * event.relative.x + camera.global_basis.y * event.relative.y) * scale_per_pixel
		update_camera()
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom_camera(pow(0.9, maxf(event.factor, 1.0)))
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			zoom_camera(pow(1.0 / 0.9, maxf(event.factor, 1.0)))
		elif event.button_index == MOUSE_BUTTON_LEFT:
			if is_instance_valid(live_world):
				var board_point := camera.unproject_position(live_world.task_label.position)
				if board_point.distance_to(event.position) < 65.0:
					live_world.emit({"type":"openPanel","panel":"human" if event.shift_pressed else "tasks"})
					return
			if not plan_rooms.is_empty() and not is_instance_valid(live_world):
				var destination := plan_room_at(event.position)
				if not destination.is_empty():
					switch_room(destination)
					return
			selected = -1
			var nearest := 48.0
			for i in range(officials.size()):
				var screen := camera.unproject_position(officials[i].node.position+Vector3(0,0.9,0))
				var distance := screen.distance_to(event.position)
				if distance < nearest:
					nearest = distance
					selected = i
			for i in range(officials.size()):
				officials[i].ring.visible = i == selected
				officials[i].label.visible = i == selected
			if is_instance_valid(live_world) and selected >= 0:
				live_world.emit({"type":"openTerminal" if event.double_click else "select", "id":officials[selected].live_id})
			if selected < 0 and not is_instance_valid(live_world):
				info.text = "Dois oficiais · pausa simulada" if refeitorio else "Dois oficiais · contabilidade simulada" if tesouraria else "Dois oficiais · estudo de cartas simulado" if cartografia else ("Seis lugares · dois oficiais · reunião simulada" if conselho else ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Clica numa sala para abrir o interior detalhado.")))
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode in [KEY_PLUS, KEY_EQUAL, KEY_KP_ADD]:
			zoom_camera(0.85)
		elif event.keycode in [KEY_MINUS, KEY_KP_SUBTRACT]:
			zoom_camera(1.0 / 0.85)
		elif event.physical_keycode == KEY_F and selected >= 0:
			camera_focus = officials[selected].node.position + Vector3(0, 0.9, 0)
			camera.size = 4.0
			update_camera()
		if event.physical_keycode == KEY_F11:
			var full := DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED if full else DisplayServer.WINDOW_MODE_FULLSCREEN)
		if event.physical_keycode == KEY_SPACE:
			paused = not paused
			if paused:
				info.text += "\nEm pausa"
			elif selected < 0:
				info.text = "Dois oficiais · pausa simulada" if refeitorio else "Dois oficiais · contabilidade simulada" if tesouraria else "Dois oficiais · estudo de cartas simulado" if cartografia else ("Seis lugares · dois oficiais · reunião simulada" if conselho else ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Clica numa sala para abrir o interior detalhado.")))
		if event.physical_keycode == KEY_R:
			camera_focus = Vector3(0,0.8,0) if gabinete or escrivaes or conselho or cartografia or tesouraria or refeitorio else Vector3(0,0.2,2.5)
			orbit = 0.0
			camera.size = 18.8 if gabinete or escrivaes or conselho or cartografia or tesouraria or refeitorio else 49.0
			update_camera()

func capture_preview() -> void:
	await get_tree().create_timer(3.0).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("/tmp/casa-preview.png")
	if "--compare-walls" in OS.get_cmdline_user_args() and not plan_rooms.is_empty():
		get_viewport().get_texture().get_image().save_png("/tmp/casa-walls-full.png")
		set_plan_walls(false)
		await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png("/tmp/casa-walls-cut.png")
	get_tree().quit()

func torus(parent: Node3D, pos: Vector3, radius: float, thickness: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := TorusMesh.new()
	mesh.inner_radius = radius-thickness
	mesh.outer_radius = radius+thickness
	mesh.rings = 20
	mesh.ring_segments = 8
	node.mesh = mesh
	node.material_override = material(color)
	parent.add_child(node)
	node.position = pos
	return node

func room_rug(parent: Node3D, center: Vector3, size: Vector3, color: Color) -> void:
	box(parent,"Tapete",center+Vector3(0,0.084,0),size,color)
	for side in [-1.0,1.0]:
		box(parent,"Bordo",center+Vector3(side*(size.x/2-0.10),0.10,0),Vector3(0.045,0.01,size.z-0.15),GOLD)
		box(parent,"Bordo",center+Vector3(0,0.10,side*(size.z/2-0.10)),Vector3(size.x-0.15,0.01,0.045),GOLD)

func room_sign(parent: Node3D, title: String, pos: Vector3) -> void:
	var label := Label3D.new()
	label.text = title
	label.font_size = 42
	label.pixel_size = 0.022
	label.modulate = CREAM
	label.outline_modulate = INK
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	parent.add_child(label)
	label.position = pos

func build_layout(world: Node3D) -> void:
	preload("res://scripts/planta.gd").new().build(self,world)

func plan_room_at(screen_position: Vector2) -> String:
	var origin := camera.project_ray_origin(screen_position)
	var direction := camera.project_ray_normal(screen_position)
	var hit = Plane(Vector3.UP,0.06).intersects_ray(origin,direction)
	if hit == null:
		return ""
	for room in plan_rooms:
		if room.bounds.has_point(Vector2(hit.x,hit.z)):
			return room.id
	return ""
