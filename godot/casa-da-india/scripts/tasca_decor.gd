extends RefCounted
## Original reusable tavern joinery, ceramics and wall decorations.
const WOOD = Color("58392c")
const TRIM = Color("95663e")
const CREAM = Color("e8dfc8")
const BLUE = Color("234a85")
const BRASS = Color("b69254")
var h: Node3D
var inox: ShaderMaterial

func _init(host: Node3D) -> void:
	h = host
	inox = ShaderMaterial.new()
	inox.shader = preload("res://scripts/tasca_inox.gdshader")

func b(p: Node3D, name: String, at: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	return h.box(p,name,at,size,color)

func tile_panel(p: Node3D, at: Vector3, size: Vector2, angle: float = 0.0) -> void:
	var mesh := MeshInstance3D.new()
	mesh.name = "AzulejosAzuisFlorais"
	var quad := QuadMesh.new()
	quad.size = size
	mesh.mesh = quad
	var glaze := ShaderMaterial.new()
	glaze.shader = preload("res://scripts/tasca_tiles.gdshader")
	glaze.set_shader_parameter("repeats",Vector2(roundf(size.x/0.52),roundf(size.y/0.52)))
	mesh.material_override = glaze
	p.add_child(mesh)
	mesh.position = at
	mesh.rotation.y = angle

func lettering(p: Node3D, words: String, at: Vector3, pixel: float = 0.004, color: Color = CREAM) -> Label3D:
	var label := Label3D.new()
	label.text = words
	label.font_size = 48
	label.pixel_size = pixel
	label.modulate = color
	label.outline_size = 0
	p.add_child(label)
	label.position = at
	return label

func frame(p: Node3D, at: Vector3, size: Vector2, background: Color) -> Node3D:
	var art = h.pivot(p,"QuadroNaParede",at)
	b(art,"Moldura",Vector3.ZERO,Vector3(size.x+0.14,size.y+0.14,0.12),WOOD)
	b(art,"DouradoInterior",Vector3(0,0,0.071),Vector3(size.x+0.04,size.y+0.04,0.035),TRIM)
	b(art,"Papel",Vector3(0,0,0.095),Vector3(size.x,size.y,0.025),background)
	return art

func photograph(p: Node3D, at: Vector3, variant: int) -> void:
	var art = frame(p,at,Vector2(1.55,1.12),Color("bcb099"))
	b(art,"CeuAntigo",Vector3(0,0.18,0.12),Vector3(1.37,0.54,0.016),Color("9caaa3"))
	b(art,"Rio",Vector3(0,-0.29,0.125),Vector3(1.37,0.24,0.016),Color("687d83"))
	for i in range(5):
		var x := -0.53+i*0.25
		var height := 0.29+float((i+variant)%3)*0.14
		b(art,"CasaAntiga",Vector3(x,-0.11+height/2,0.14),Vector3(0.2,height,0.02),Color("d4bea0"))
		var roof = b(art,"Telhado",Vector3(x,0.03+height/2,0.16),Vector3(0.16,0.16,0.02),Color("815e49"))
		roof.rotation.z = PI/4
		b(art,"Janela",Vector3(x,0.04,0.18),Vector3(0.045,0.08,0.012),WOOD)

func wall_plate(p: Node3D, at: Vector3, radius: float = 0.37) -> void:
	var disk = h.round_shape(p,"PratoDeParede",at,radius,0.065,CREAM)
	disk.rotation.x = PI/2
	var ring = h.torus(p,at+Vector3(0,0,0.045),radius*0.82,0.025,BLUE)
	ring.rotation.x = PI/2
	for i in range(8):
		var angle := i*TAU/8
		var petal = h.ball(p,at+Vector3(cos(angle)*radius*0.42,sin(angle)*radius*0.42,0.075),Vector3(0.085,0.14,0.016),BLUE)
		petal.rotation.z = angle-PI/2
	h.ball(p,at+Vector3(0,0,0.08),Vector3(0.12,0.12,0.02),BRASS)

func bottle(p: Node3D, at: Vector3, variant: int = 0) -> void:
	var color: Color = [Color("364f39"),Color("604331"),Color("5b6b3b")][variant%3]
	h.round_shape(p,"Garrafa",at+Vector3(0,0.23,0),0.1,0.46,color)
	h.round_shape(p,"Gargalo",at+Vector3(0,0.52,0),0.047,0.18,color)
	b(p,"Rotulo",at+Vector3(0,0.22,0.103),Vector3(0.13,0.16,0.014),CREAM)
	h.round_shape(p,"Rolha",at+Vector3(0,0.62,0),0.052,0.04,TRIM)

func shelving(p: Node3D, at: Vector3, width: float = 4.6) -> void:
	var shelf = h.pivot(p,"GarrafeiraDeMadeira",at)
	b(shelf,"Fundo",Vector3(0,1.4,-0.25),Vector3(width,2.8,0.15),WOOD)
	for x in [-width/2,width/2]:
		b(shelf,"Ilharga",Vector3(x,1.4,0),Vector3(0.16,2.8,0.72),TRIM)
	for y in [0.2,1.05,1.9,2.78]:
		b(shelf,"Prateleira",Vector3(0,y,0),Vector3(width,0.14,0.75),TRIM)
		if y > 2.0: continue
		for i in range(int(width/0.43)-1):
			if (i+int(y*10))%4==0: continue
			var item = h.pivot(shelf,"Reserva",Vector3(-width/2+0.42+i*0.43,y+0.07,0.04+0.08*sin(i*2.1)))
			item.rotation.y = sin(i*3.0)*0.3
			item.scale = Vector3.ONE*(0.8+float(i%3)*0.1)
			if y<0.5 and i%2==0:
				h.round_shape(item,"PoteConserva",Vector3(0,0.18,0),0.15,0.36,CREAM)
				h.round_shape(item,"TampaConserva",Vector3(0,0.38,0),0.16,0.04,BLUE)
			else: bottle(item,Vector3.ZERO,i)

func chair(p: Node3D, at: Vector3, angle: float) -> void:
	var node = h.pivot(p,"CadeiraDeMadeira",at)
	node.rotation.y = angle
	b(node,"AssentoPalhinha",Vector3(0,0.57,0),Vector3(0.66,0.13,0.64),TRIM)
	for x in [-0.26,0.26]:
		for z in [-0.24,0.24]:
			b(node,"Perna",Vector3(x,0.28,z),Vector3(0.09,0.56,0.09),WOOD)
		b(node,"Espaldar",Vector3(x,0.96,-0.26),Vector3(0.075,0.83,0.075),WOOD)
	for y in [0.83,1.02,1.25]:
		b(node,"Travessa",Vector3(0,y,-0.26),Vector3(0.59,0.085,0.085),WOOD)

func place_setting(p: Node3D, at: Vector3, variant: int = 0) -> void:
	h.round_shape(p,"Prato",at,0.28,0.025,CREAM)
	h.torus(p,at+Vector3(0,0.023,0),0.23,0.013,BLUE)
	if variant%3 == 0:
		for i in range(3): h.ball(p,at+Vector3(-0.12+i*0.11,0.06,0),Vector3(0.12,0.065,0.085),Color("ad8138"))
	elif variant%3 == 1:
		h.ball(p,at+Vector3(0,0.04,0),Vector3(0.34,0.04,0.16),Color("c1ac79"))
		h.ball(p,at+Vector3(0.06,0.06,0.13),Vector3(0.16,0.07,0.09),Color("74804a"))
	for x in [-0.39,0.39]:
		b(p,"Talher",at+Vector3(x,0.02,0),Vector3(0.035,0.025,0.35),Color("a9afa9"))
	h.round_shape(p,"CopoVinho",at+Vector3(0.35,0.09,-0.35),0.07,0.16,Color("7a5549"))

func table(p: Node3D, at: Vector3, width: float = 1.8, cloth: bool = false, variant: int = 0) -> void:
	var node = h.pivot(p,"MesaDaTasca",at)
	b(node,"Tampo",Vector3(0,0.99,0),Vector3(width,0.15,1.65),CREAM if not cloth else WOOD)
	for x in [-width/2+0.2,width/2-0.2]:
		for z in [-0.6,0.6]:
			b(node,"PeTorneado",Vector3(x,0.47,z),Vector3(0.13,0.94,0.13),WOOD)
	if cloth:
		b(node,"ToalhaLinho",Vector3(0,1.073,0),Vector3(width+0.05,0.02,1.7),CREAM)
		for i in range(int(width/0.24)):
			b(node,"QuadradosVermelhos",Vector3(-width/2+0.12+i*0.24,1.089,0),Vector3(0.1,0.008,1.7),(Color("a95a50") if variant==0 else Color("537f91")))
		for z in [-0.72,-0.48,-0.24,0.0,0.24,0.48,0.72]:
			b(node,"TramaVermelha",Vector3(0,1.094,z),Vector3(width,0.008,0.085),(Color("b27161") if variant==0 else Color("829ca6")))
	else:
		b(node,"Papel",Vector3(0,1.073,0),Vector3(width-0.12,0.014,1.5),Color("eee8d9"))
	for x in ([-3.0,0.0,3.0] if width > 5 else [0.0]):
		place_setting(node,Vector3(x,1.115,-0.35),variant+int((x+3)/3))
		place_setting(node,Vector3(x+0.08,1.115,0.38),variant+int((x+3)/3)+1)
	if variant%3==0:
		bottle(node,Vector3(width/2-0.26,1.12,0),1)
	elif variant%3==1:
		h.round_shape(node,"JarroBarro",Vector3(width/2-0.3,1.3,0),0.15,0.36,TRIM,0.11)
	else:
		b(node,"Guardanapeiro",Vector3(width/2-0.3,1.23,0),Vector3(0.2,0.22,0.3),WOOD)
		b(node,"Guardanapos",Vector3(width/2-0.3,1.28,0),Vector3(0.15,0.24,0.24),CREAM)

func window(p: Node3D, at: Vector3) -> void:
	var node = h.pivot(p,"JanelaComCortinas",at)
	b(node,"Vidro",Vector3.ZERO,Vector3(1.9,1.7,0.06),Color("96b7bf"))
	for x in [-1.0,0.0,1.0]: b(node,"Caixilho",Vector3(x,0,0.07),Vector3(0.08,1.9,0.12),WOOD)
	for y in [-0.92,0.0,0.92]: b(node,"Travessa",Vector3(0,y,0.07),Vector3(2.08,0.08,0.12),WOOD)
	b(node,"Peitoril",Vector3(0,-0.97,0.19),Vector3(2.3,0.14,0.4),CREAM)
	for side in [-1.0,1.0]:
		for i in range(5):
			b(node,"PregaCortina",Vector3(side*(0.63+i*0.10),0,0.19+float(i%2)*0.06),Vector3(0.1,1.74,0.055),Color("cfbca0"))

func plant(p: Node3D, at: Vector3) -> void:
	h.round_shape(p,"VasoTerracota",at+Vector3(0,0.28,0),0.32,0.56,Color("ab694a"),0.43)
	for i in range(5):
		var a := i*TAU/5
		h.ball(p,at+Vector3(cos(a)*0.26,0.76+float(i%2)*0.17,sin(a)*0.26),Vector3(0.5,0.62,0.42),Color("526b3e"))

func lamp(p: Node3D, at: Vector3) -> void:
	b(p,"BracoCandeeiro",at+Vector3(0,0.1,0.1),Vector3(0.07,0.4,0.32),BRASS)
	h.round_shape(p,"Abajur",at+Vector3(0,0,0.34),0.28,0.32,Color("d4ae69"),0.12)
	h.ball(p,at+Vector3(0,-0.14,0.34),Vector3(0.2,0.12,0.2),Color("f4d990"))

func clock(p: Node3D, at: Vector3) -> void:
	var rim = h.round_shape(p,"RelogioDeParede",at,0.48,0.09,WOOD)
	rim.rotation.x = PI/2
	var face = h.round_shape(p,"Mostrador",at+Vector3(0,0,0.055),0.41,0.025,CREAM)
	face.rotation.x = PI/2
	for i in range(12):
		var angle := i*TAU/12
		var mark = b(p,"Hora",at+Vector3(sin(angle)*0.34,cos(angle)*0.34,0.08),Vector3(0.028,0.066,0.012),BLUE)
		mark.rotation.z = -angle
	b(p,"PonteiroMinutos",at+Vector3(0,0.13,0.10),Vector3(0.025,0.28,0.012),WOOD)
	var hand = b(p,"PonteiroHoras",at+Vector3(0.075,-0.04,0.105),Vector3(0.20,0.035,0.012),WOOD)
	hand.rotation.z = -0.45

func guitar(p: Node3D, at: Vector3) -> void:
	var instrument = h.pivot(p,"GuitarraNaParede",at)
	instrument.rotation.z = -0.18
	h.ball(instrument,Vector3(0,-0.22,0),Vector3(0.72,0.83,0.13),TRIM)
	h.ball(instrument,Vector3(0,0.1,0),Vector3(0.51,0.61,0.12),TRIM)
	var sound = h.round_shape(instrument,"Boca",Vector3(0,0.025,0.085),0.105,0.02,WOOD)
	sound.rotation.x = PI/2
	b(instrument,"Braco",Vector3(0,0.6,0.04),Vector3(0.10,0.82,0.10),WOOD)
	b(instrument,"Cabeca",Vector3(0,1.05,0.04),Vector3(0.17,0.22,0.1),TRIM)
	for x in [-0.035,0.0,0.035]: b(instrument,"Corda",Vector3(x,0.3,0.12),Vector3(0.006,1.37,0.008),CREAM)

func steel_box(p: Node3D, title: String, at: Vector3, size: Vector3) -> MeshInstance3D:
	var node = b(p,title,at,size,Color("a0aaae"))
	node.material_override = inox
	return node

func steel_rail(p: Node3D, at: Vector3, length: float, radius: float) -> void:
	var rail = h.round_shape(p,"TuboInox",at,radius,length,Color("a0aaae"))
	rail.rotation.z = PI/2
	rail.material_override = inox

func saying(p: Node3D, words: String, at: Vector3, size: Vector2, pixel: float = 0.0045) -> void:
	var plaque = h.pivot(p,"DizerPortugues",at)
	b(plaque,"PlacaCeramica",Vector3.ZERO,Vector3(size.x,size.y,0.095),CREAM)
	for side in [-1.0,1.0]:
		b(plaque,"CercaduraVertical",Vector3(side*(size.x/2-0.07),0,0.06),Vector3(0.035,size.y-0.1,0.018),BLUE)
		b(plaque,"CercaduraHorizontal",Vector3(0,side*(size.y/2-0.07),0.06),Vector3(size.x-0.1,0.035,0.018),BLUE)
		for end in [-1.0,1.0]:
			var corner := Vector3(side*(size.x/2-0.16),end*(size.y/2-0.16),0.075)
			for i in range(4):
				var a := i*PI/2
				h.ball(plaque,corner+Vector3(cos(a)*0.045,sin(a)*0.045,0),Vector3(0.045,0.045,0.012),BLUE)
	lettering(plaque,words,Vector3(0,0,0.078),pixel,BLUE)

func pot(p: Node3D, at: Vector3, radius: float, height: float, color: Color, lid: bool) -> void:
	h.round_shape(p,"Panela",at+Vector3(0,height/2,0),radius,height,color)
	h.torus(p,at+Vector3(0,height,0),radius,0.025,color.lightened(0.2))
	for side in [-1,1]:
		b(p,"AsaPanela",at+Vector3(side*(radius+0.1),height*0.7,0),Vector3(0.22,0.065,0.16),Color("323b3c"))
	if lid:
		h.round_shape(p,"TampaPanela",at+Vector3(0,height+0.025,0),radius+0.02,0.045,color)
		h.ball(p,at+Vector3(0,height+0.09,0),Vector3(0.13,0.1,0.13),WOOD)
	else:
		h.round_shape(p,"Caldo",at+Vector3(0,height+0.003,0),radius*0.88,0.012,Color("a8783c"))

func frying_pan(p: Node3D, at: Vector3) -> void:
	h.round_shape(p,"Frigideira",at+Vector3(0,0.055,0),0.32,0.11,Color("303639"))
	h.torus(p,at+Vector3(0,0.115,0),0.3,0.02,Color("697577"))
	b(p,"CaboFrigideira",at+Vector3(0.55,0.075,0),Vector3(0.5,0.075,0.1),WOOD)
	h.ball(p,at+Vector3(-0.06,0.12,0),Vector3(0.31,0.025,0.23),CREAM)
	h.ball(p,at+Vector3(-0.06,0.145,0),Vector3(0.11,0.025,0.11),Color("d5a23d"))
