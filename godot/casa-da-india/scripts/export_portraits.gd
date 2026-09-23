extends SceneTree
## Render the same character geometry used in the world, with no UI or demo scene.
func _initialize() -> void:
	call_deferred("render_portraits")

func render_portraits() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() != 2:
		printerr("Expected roster JSON and output directory")
		quit(1)
		return
	var roster: Array = JSON.parse_string(FileAccess.get_file_as_string(args[0]))
	root.size = Vector2i(256,320)
	root.transparent_bg = true
	var stage := Node3D.new()
	root.add_child(stage)
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_CLEAR_COLOR
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color("fff1df")
	environment.environment.ambient_light_energy = 0.65
	stage.add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-35,-25,0)
	sun.light_energy = 0.8
	stage.add_child(sun)
	var camera := Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 2.3
	camera.position = Vector3(0,1.8,5)
	stage.add_child(camera)
	camera.look_at(Vector3(0,1.0,0))
	camera.current = true
	var helper = load("res://scripts/casa.gd").new()
	for person in roster:
		var appearance := {"skin":person.pele,"hair":person.cabelo,"cloth":person.corCorpo,"beard":person.barba,"hat":person.cabeca,"cape":person.capa,"capeColor":person.corCapa,"outfit":person.get("outfit", "")}
		helper.make_official(stage,person.nome,"",Color(person.corCorpo),[Vector3.ZERO,Vector3.ZERO],0,appearance)
		var actor: Node3D = helper.officials.back().node
		actor.rotation.y = -0.18
		await process_frame
		await RenderingServer.frame_post_draw
		var picture := root.get_texture().get_image()
		var err := picture.save_png(args[1].path_join(person.id+".png"))
		if err != OK:
			printerr("Failed portrait: ",person.id)
			quit(1)
			return
		actor.queue_free()
		helper.officials.clear()
		await process_frame
	helper.free()
	print("Rendered ",roster.size()," Godot portraits")
	quit()
