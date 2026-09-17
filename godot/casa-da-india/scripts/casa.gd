@tool
extends Node3D
## Maquete independente. Geometria original construída no editor e em execução.

const CREAM = Color("e8d9ba")
const WOOD = Color("78503d")
const GOLD = Color("c69b59")
const INK = Color("294954")
@export var gabinete := false
@export var escrivaes := false
var camera: Camera3D
var officials: Array[Dictionary] = []
var info: Label
var paused := false
var elapsed := 0.0
var selected := -1
var orbit := 0.0
var camera_focus := Vector3(0,0.2,0.5)

func material(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.88
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
	sun.directional_shadow_max_distance = 65.0
	sun.directional_shadow_pancake_size = 0.0
	sun.shadow_bias = 0.2
	sun.shadow_normal_bias = 1.0
	world.add_child(sun)
	var backdrop := box(world, "Fundo", Vector3(0,-0.85,0), Vector3(200,0.2,200), Color("b8ced0"))
	backdrop.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if escrivaes:
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
		make_official(world,"Fernão Lourenço","Feitor",Color("9b5149"),[Vector3(-5.3,0,-3.0),Vector3(-5.3,0,-2),Vector3(-0.65,0,-2),Vector3(-0.65,0,3.5),Vector3(-0.65,0,-2),Vector3(-5.3,0,-2)],0)
		make_official(world,"Pêro Vaz de Caminha","Escrivão",Color("487b80"),[Vector3(4.0,0,-3),Vector3(4,0,-2),Vector3(0.65,0,-2),Vector3(0.65,0,0.8),Vector3(0.65,0,-2),Vector3(4,0,-2)],1)
		make_official(world,"Tomé Pires","Boticário e cronista",Color("73844b"),[Vector3(-5.3,0,3),Vector3(-5.3,0,3.5),Vector3(-0.65,0,3.5),Vector3(-0.65,0,6),Vector3(-0.65,0,3.5),Vector3(-5.3,0,3.5)],2)
	camera = Camera3D.new()
	camera.name = "CameraDaMaquete"
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 18.8 if gabinete or escrivaes else 25.5
	camera.near = 5.0
	camera.far = 65.0
	world.add_child(camera)
	update_camera()
	camera.current = true
	if not Engine.is_editor_hint():
		make_ui()
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

func make_official(parent: Node3D, title: String, role: String, color: Color, route: Array, index: int) -> void:
	var actor := pivot(parent,title,route[0])
	actor.rotation.y = PI
	var body := pivot(actor,"Corpo",Vector3.ZERO)
	var skin: Color = [Color("efbd96"),Color("e6ae87"),Color("d99e76")][index]
	var hair: Color = [Color("554139"),Color("755340"),Color("3e3534")][index]
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
	if index == 0:
		for side in [-1.0,1.0]:
			var moustache := ball(head,Vector3(side*0.065,-0.125,0.365),Vector3(0.145,0.055,0.045),hair)
			moustache.rotation.z = side*0.22
	if index == 1:
		ball(head,Vector3(0,-0.26,0.24),Vector3(0.36,0.19,0.2),hair)
	for i in range(4):
		ball(head,Vector3(-0.24+i*0.15,0.25-abs(i-1.0)*0.025,0.21),Vector3(0.24,0.19,0.2),hair)
	var hat := pivot(head,"Boina",Vector3(0,0.32,-0.02))
	hat.rotation.z = -0.12+index*0.1
	ball(hat,Vector3.ZERO,Vector3(0.86,0.20,0.73),color.darkened(0.25))
	ball(hat,Vector3(-0.06,0.095,0),Vector3(0.7,0.23,0.58),color)
	ball(hat,Vector3(0.23,0.04,0.28),Vector3(0.09,0.10,0.045),GOLD)
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

func animate_official(a: Dictionary, delta: float) -> void:
	var actor: Node3D = a.node
	var direction: Vector3 = a.route[a.target]-actor.position
	var desired_speed := 0.0
	if a.wait > 0.0:
		a.wait = maxf(0.0,a.wait-delta)
		a.state = "A trabalhar" if a.target == 1 else "A consultar registos"
	else:
		if direction.length() < 0.025:
			actor.position = a.route[a.target]
			a.target = (int(a.target)+1)%a.route.size()
			a.wait = 3.8+float(a.index)*0.8
			a.facing = (0.0 if gabinete else PI) if a.target == 1 else actor.rotation.y+0.45
		else:
			a.facing = atan2(direction.x,direction.z)
			# Travar antes da paragem e começar só depois de virar o corpo.
			var facing_error := absf(wrapf(float(a.facing)-actor.rotation.y,-PI,PI))
			desired_speed = minf(0.88+float(a.index)*0.06,sqrt(2.0*1.7*direction.length()))
			desired_speed *= clampf(1.0-facing_error/1.8,0.0,1.0)
			a.state = "A circular"
	a.speed = move_toward(float(a.speed),desired_speed,delta*1.7)
	actor.rotation.y = lerp_angle(actor.rotation.y,float(a.facing),1.0-exp(-delta*5.0))
	var distance := minf(float(a.speed)*delta,direction.length()) if a.wait <= 0.0 else 0.0
	if distance > 0.0:
		actor.position += direction.normalized()*distance
	a.phase += distance*TAU/0.72
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
	var working: float = (1.0-blend) if a.target == 1 else 0.0
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
	camera.position = camera_focus + Vector3(sin(orbit+0.23)*22,19 if gabinete or escrivaes else 27,cos(orbit+0.23)*22)
	camera.look_at(camera_focus)

func make_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var panel := PanelContainer.new()
	panel.position = Vector2(28,750) if gabinete or escrivaes else Vector2(28,85)
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
	subtitle.text = "Sala dos Escrivães · Registos e correspondência" if escrivaes else ("Gabinete do Feitor · Estudo de interior" if gabinete else "Passo 1 · Planta da Casa")
	subtitle.modulate = Color("e4c28c")
	stack.add_child(subtitle)
	info = Label.new()
	info.text = ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Três oficiais · rotinas simuladas\nSeleciona uma personagem para a acompanhar."))
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
	for entry in [["Gabinete", "gabinete"], ["Escrivães", "escrivaes"], ["Planta", "casa"]]:
		var button := Button.new()
		button.text = entry[0]
		button.custom_minimum_size = Vector2(125,40)
		button.disabled = (entry[1] == "gabinete" and gabinete) or (entry[1] == "escrivaes" and escrivaes) or (entry[1] == "casa" and not gabinete and not escrivaes)
		button.pressed.connect(switch_room.bind(entry[1]))
		rooms.add_child(button)

func switch_room(room_name: String) -> void:
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
		animate_official(a,delta)
	if selected >= 0:
		var a := officials[selected]
		info.text = "%s · %s\n%s" % [a.name,a.role,a.state]

func zoom_camera(factor: float) -> void:
	camera.size = clampf(camera.size * factor, 2.5, 30.0)

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
			if selected < 0:
				info.text = ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Três oficiais · rotinas simuladas\nSeleciona uma personagem para a acompanhar."))
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
				info.text = ("Seis postos · três oficiais · rotinas simuladas" if escrivaes else ("Fernão Lourenço · rotina simulada" if gabinete else "Três oficiais · rotinas simuladas\nSeleciona uma personagem para a acompanhar."))
		if event.physical_keycode == KEY_R:
			camera_focus = Vector3(0,0.8,0) if gabinete or escrivaes else Vector3(0,0.2,0.5)
			orbit = 0.0
			camera.size = 18.8 if gabinete or escrivaes else 25.5
			update_camera()

func capture_preview() -> void:
	await get_tree().create_timer(3.0).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("/tmp/casa-preview.png")
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
	label.pixel_size = 0.009
	label.modulate = CREAM
	label.outline_modulate = INK
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	parent.add_child(label)
	label.position = pos

func build_layout(world: Node3D) -> void:
	var building := pivot(world,"Edificio",Vector3.ZERO)
	box(building,"Fundacao",Vector3(0,-0.35,0),Vector3(18.4,0.7,14.4),Color("b7ac96"))
	for x in range(23):
		for z in range(18):
			var color := Color("c89873") if absf(-8.8+x*0.8)>1.6 else Color("d8c5a3")
			box(building,"Laje",Vector3(-8.8+x*0.8,0.025,-6.8+z*0.8),Vector3(0.78,0.07,0.78),color.lightened(float((x+z*3)%4)*0.015))
	box(building,"ParedeNorte",Vector3(0,1.5,-7.12),Vector3(18.4,3,0.26),CREAM)
	box(building,"VigaNorte",Vector3(0,3.02,-7.12),Vector3(18.5,0.20,0.38),WOOD)
	# Paredes em corte, para ler os quatro espaços de uma só vez.
	for side in [-1.0,1.0]:
		box(building,"ParedeExterior",Vector3(side*9.08,0.5,0),Vector3(0.24,1,14.3),CREAM)
		box(building,"DivisoriaSalas",Vector3(side*5.35,0.45,0),Vector3(7.25,0.9,0.24),CREAM)
		box(building,"Capeamento",Vector3(side*5.35,0.94,0),Vector3(7.3,0.10,0.3),Color("f1e4ca"))
		# Portas de 1,8 m nos dois lados do corredor.
		for limits in [Vector2(-7,-2.9),Vector2(-1.1,2.6),Vector2(4.4,7)]:
			box(building,"ParedeCorredor",Vector3(side*1.7,0.45,(limits.x+limits.y)/2),Vector3(0.22,0.9,limits.y-limits.x),CREAM)
		for door_z in [-2.0,3.5]:
			for edge in [-0.92,0.92]:
				box(building,"Ombreira",Vector3(side*1.7,0.65,door_z+edge),Vector3(0.3,1.3,0.15),WOOD)
			box(building,"Soleira",Vector3(side*1.7,0.075,door_z),Vector3(0.45,0.04,1.8),Color("e9daba"))
	room_rug(building,Vector3(0,0,0),Vector3(2.45,0.022,13.4),Color("984b45"))
	var feitor := pivot(building,"GabineteDoFeitor",Vector3(-5.3,0,-4))
	room_rug(feitor,Vector3(0,0,0.3),Vector3(4.2,0.022,3.2),Color("984b45"))
	desk(feitor,Vector3.ZERO)
	shelf(feitor,Vector3(-2.4,0,-2.5))
	box(feitor,"Estandarte",Vector3(0,1.95,-2.96),Vector3(1.8,1.65,0.04),Color("994444"))
	box(feitor,"Emblema",Vector3(0,1.95,-2.92),Vector3(0.45,0.65,0.03),GOLD)
	room_sign(feitor,"FEITOR",Vector3(0,2.9,-2.6))
	var scribes := pivot(building,"SalaDosEscrivaes",Vector3(5.3,0,-4))
	for x in [-1.3,1.4]:
		desk(scribes,Vector3(x,0,0))
		desk(scribes,Vector3(x,0,-1.8))
	room_sign(scribes,"ESCRIVÃES",Vector3(0,2.9,-2.6))
	var archive := pivot(building,"CartografiaEArquivo",Vector3(-5.3,0,2))
	room_rug(archive,Vector3(0,0,0.5),Vector3(4.2,0.022,3.3),Color("46757b"))
	desk(archive,Vector3.ZERO)
	for x in [-2.2,0.0,2.2]:
		shelf(archive,Vector3(x,0,-1.5))
	ball(archive,Vector3(2.1,1.2,0.6),Vector3(0.85,0.85,0.85),Color("6aabb0"))
	round_shape(archive,"PeGlobo",Vector3(2.1,0.5,0.6),0.11,1.0,WOOD)
	room_sign(archive,"CARTOGRAFIA · ARQUIVO",Vector3(0,2.8,-1.5))
	var treasury := pivot(building,"Tesouraria",Vector3(5.3,0,2))
	room_rug(treasury,Vector3(0,0,0.5),Vector3(4.2,0.022,3.3),Color("708366"))
	desk(treasury,Vector3.ZERO)
	for x in [-2.0,0.0,2.0]:
		box(treasury,"Cofre",Vector3(x,0.5,-1.3),Vector3(1.35,1,0.8),WOOD.darkened(0.2))
		for side in [-0.5,0.5]:
			box(treasury,"Ferragem",Vector3(x+side,0.5,-0.88),Vector3(0.08,0.95,0.04),GOLD)
		ball(treasury,Vector3(x,0.6,-0.86),Vector3(0.16,0.18,0.06),GOLD)
	for x in [-0.3,0.1,0.5]:
		round_shape(treasury,"Moedas",Vector3(x,1.09,0.1),0.08,0.15,GOLD)
	room_sign(treasury,"TESOURARIA",Vector3(0,2.8,-1.5))
	var entrance := pivot(world,"EntradaECais",Vector3.ZERO)
	for side in [-1.0,1.0]:
		box(entrance,"FachadaEmCorte",Vector3(side*5.35,0.38,7.1),Vector3(7.3,0.76,0.3),CREAM)
		box(entrance,"PilarEntrada",Vector3(side*1.45,0.9,7.1),Vector3(0.35,1.8,0.4),CREAM)
	box(entrance,"Patio",Vector3(0,-0.12,8.1),Vector3(18.4,0.24,1.7),Color("c4b89e"))
	for x in [-7.7,-6.6,-5.5]:
		barrel(entrance,Vector3(x,0,6.1))
	box(entrance,"Mercadoria",Vector3(-4.2,0.45,6.1),Vector3(1.2,0.9,0.9),WOOD)
	box(entrance,"Tejo",Vector3(0,-0.45,10.7),Vector3(18.4,0.16,3.5),Color("599d9f"))
	for i in range(12):
		box(entrance,"TabuaPontao",Vector3(0,-0.04,9+i*0.28),Vector3(2.5,0.16,0.26),WOOD.lightened(float(i%3)*0.025))
	for side in [-1.0,1.0]:
		for z in [9.1,11.9]:
			round_shape(entrance,"Estaca",Vector3(side*1.1,-0.15,z),0.12,0.9,WOOD)
			for y in [0.10,0.15]:
				torus(entrance,Vector3(side*1.1,y,z),0.12,0.025,CREAM)
