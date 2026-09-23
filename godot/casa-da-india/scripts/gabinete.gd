@tool
extends RefCounted
## Interior autónomo: composição e adereços do gabinete do Feitor.
const PLASTER = Color("d9c9a7")
const OAK = Color("634333")
const TRIM = Color("a5794a")
const BRASS = Color("bb914d")
const RED = Color("853f40")
const PAPER = Color("eddbad")
var h: Node3D

func b(p: Node3D, title: String, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	return h.box(p,title,pos,size,color)

func rod(p: Node3D, start: Vector3, end: Vector3, radius: float, color: Color) -> Node3D:
	var n = h.round_shape(p,"Torneado",(start+end)/2,radius,start.distance_to(end),color)
	if absf((end-start).normalized().dot(Vector3.UP)) < 0.999:
		n.quaternion = Quaternion(Vector3.UP,(end-start).normalized())
	return n

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"GabineteDetalhado",Vector3.ZERO)
	b(room,"Embasamento",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	# Terracota, juntas estreitas e uma faixa de pedra junto às paredes.
	for x in range(25):
		for z in range(16):
			b(room,"Ladrilho",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.633,0.06,0.633),Color("b78964").lightened(float((x*3+z*7)%6)*0.015))
	b(room,"ParedeFundo",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedeLateral",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteDireito",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for x in [-8.0,-3.1,2.0,8.0]:
		b(room,"PilarDePedra",Vector3(x,2.35,-4.88),Vector3(0.26,4.7,0.32),Color("c3b18d"))
		for y in [0.25,1.6,3.2,4.4]:
			b(room,"JuntaCantaria",Vector3(x,y,-4.86),Vector3(0.32,0.10,0.38),PAPER)
	for y in [0.14,1.1,4.48,4.68]:
		b(room,"FrisoNorte",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoPoente",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for x in range(20):
		b(room,"Lambrim",Vector3(-7.6+x*0.8,0.62,-4.94),Vector3(0.70,0.8,0.10),OAK.lightened(0.035))
		b(room,"PainelRebaixado",Vector3(-7.6+x*0.8,0.62,-4.87),Vector3(0.52,0.57,0.035),TRIM.darkened(0.22))
	for z in range(13):
		b(room,"LambrimLateral",Vector3(-7.95,0.62,-4.7+z*0.75),Vector3(0.10,0.8,0.67),OAK)
	# Consolas no alto sugerem a cobertura retirada para observar a sala.
	for x in [-6,-3,0,3,6]:
		b(room,"ConsolaViga",Vector3(x,4.35,-4.58),Vector3(0.20,0.32,0.8),OAK)
	for z in [-2.6,1.3]:
		window(room,z)
	# Tapeçaria central, bordada, com emblema geométrico original.
	b(room,"Tapeçaria",Vector3(-0.55,2.8,-4.88),Vector3(2.55,2.65,0.06),RED)
	for x in [-1.76,0.66]:
		b(room,"BordadoVertical",Vector3(x,2.8,-4.835),Vector3(0.055,2.62,0.025),BRASS)
	for y in [1.52,4.08]:
		b(room,"BordadoHorizontal",Vector3(-0.55,y,-4.835),Vector3(2.5,0.055,0.025),BRASS)
	for x in range(17):
		rod(room,Vector3(-1.72+x*0.146,1.48,-4.84),Vector3(-1.72+x*0.146,1.31,-4.84),0.017,BRASS)
	b(room,"Escudo",Vector3(-0.55,2.85,-4.79),Vector3(0.84,1.05,0.06),PAPER)
	for offset in [Vector2(0,0),Vector2(-0.22,0),Vector2(0.22,0),Vector2(0,0.28),Vector2(0,-0.28)]:
		b(room,"Quina",Vector3(-0.55+offset.x,2.85+offset.y,-4.745),Vector3(0.12,0.18,0.02),Color("3c6077"))
	rod(room,Vector3(-1.94,4.22,-4.76),Vector3(0.85,4.22,-4.76),0.05,BRASS)
	wall_map(room,Vector3(4.5,2.8,-4.82))
	bookcase(room,Vector3(-5.45,0,-4.25))
	carpet(room)
	writing_desk(room)
	chair(room,Vector3(0,0,-3.55))
	globe(room,Vector3(-4.7,0,2.1))
	var cabinet = h.pivot(room,"ArquivoDeCartas",Vector3(5.6,0,-3.9))
	b(cabinet,"Armario",Vector3(0,0.8,0),Vector3(2.75,1.55,1.1),OAK)
	for x in [-0.88,0.0,0.88]:
		for y in [0.30,0.76,1.22]:
			b(cabinet,"Gaveta",Vector3(x,y,0.58),Vector3(0.81,0.36,0.10),TRIM.darkened(0.1))
			h.ball(cabinet,Vector3(x,y,0.65),Vector3(0.10,0.075,0.06),BRASS)
			b(cabinet,"Etiqueta",Vector3(x,y+0.09,0.64),Vector3(0.22,0.07,0.01),PAPER)
	for x in [4.7,5.0,5.3]:
		scroll(room,Vector3(x,1.64,-3.8))
	var chart = h.pivot(room,"MesaDeConsulta",Vector3(4.2,0,1.5))
	h.desk(chart,Vector3.ZERO)
	b(chart,"CartaAberta",Vector3(0,1.03,0),Vector3(1.35,0.02,0.76),PAPER)
	for i in range(5):
		rod(chart,Vector3(-0.5+i*0.22,1.048,-0.29),Vector3(-0.3+i*0.22,1.048,0.26),0.008,TRIM)
	stool(room,Vector3(4.3,0,2.7))
	for pos in [Vector3(-6.9,0,3.7),Vector3(7.0,0,-1.3)]:
		plant(room,pos)
	for x in [-2.5,1.45]:
		candle(room,Vector3(x,2.4,-4.45),true)
	# Pequeno modelo de nau sobre o arquivo: casco, mastro e vela.
	h.ball(cabinet,Vector3(0.4,1.8,0),Vector3(1.3,0.35,0.45),TRIM)
	rod(cabinet,Vector3(0.4,1.8,0),Vector3(0.4,2.85,0),0.025,OAK)
	b(cabinet,"VelaDaNau",Vector3(0.66,2.48,0),Vector3(0.47,0.55,0.035),PAPER)

func window(p: Node3D, z: float) -> void:
	b(p,"VaoAzul",Vector3(-7.93,2.65,z),Vector3(0.05,2.1,1.7),Color("709799"))
	for side in [-1,1]:
		b(p,"OmbreiraJanela",Vector3(-7.78,2.6,z+side*0.93),Vector3(0.32,2.3,0.20),PAPER)
	for y in [1.46,3.77]:
		b(p,"CantariaJanela",Vector3(-7.77,y,z),Vector3(0.35,0.20,2.05),PAPER)
	for dz in [-0.55,0,0.55]:
		b(p,"Caixilho",Vector3(-7.84,2.65,z+dz),Vector3(0.09,2.1,0.045),OAK)
	for y in [1.95,2.65,3.35]:
		b(p,"Travessa",Vector3(-7.82,y,z),Vector3(0.09,0.045,1.7),OAK)
	b(p,"Peitoril",Vector3(-7.63,1.45,z),Vector3(0.7,0.16,2.05),PAPER)
	for side in [-1,1]:
		b(p,"Portada",Vector3(-7.8,2.65,z+side*1.21),Vector3(0.18,2.15,0.36),OAK)

func carpet(p: Node3D) -> void:
	h.room_rug(p,Vector3(0,0,0),Vector3(6.9,0.025,6.1),RED)
	for side in [-1.0,1.0]:
		for i in range(23):
			var n = b(p,"BordadoTapete",Vector3(-3.05+i*0.277,0.105,side*2.7),Vector3(0.10,0.012,0.10),PAPER)
			n.rotation.y = PI/4
		for i in range(20):
			var n = b(p,"BordadoTapete",Vector3(side*3.08,0.105,-2.6+i*0.274),Vector3(0.10,0.012,0.10),BRASS)
			n.rotation.y = PI/4
		for i in range(33):
			b(p,"FranjaTapete",Vector3(-3.3+i*0.205,0.075,side*3.13),Vector3(0.025,0.018,0.20),PAPER)
	for radius in [0.50,0.72,0.77]:
		h.torus(p,Vector3(0,0.11,1.7),radius,0.018,BRASS)
	for i in range(8):
		var angle = i*TAU/8
		rod(p,Vector3(0,0.12,1.7),Vector3(sin(angle)*0.66,0.12,1.7+cos(angle)*0.66),0.016,PAPER)

func writing_desk(p: Node3D) -> void:
	var d = h.pivot(p,"SecretariaDoFeitor",Vector3(0,0,-0.8))
	b(d,"TampoMoldurado",Vector3(0,1.22,0),Vector3(4.1,0.20,1.85),OAK)
	b(d,"Rebordo",Vector3(0,1.33,0),Vector3(4.18,0.055,1.91),TRIM)
	b(d,"CouroDoTampo",Vector3(0,1.366,0),Vector3(3.65,0.02,1.49),Color("4e6259"))
	for x in [-1.65,1.65]:
		for z in [-0.64,0.64]:
			rod(d,Vector3(x,0.13,z),Vector3(x,1.13,z),0.12,OAK)
			for y in [0.18,0.44,0.9]:
				h.round_shape(d,"AnelPerna",Vector3(x,y,z),0.16,0.09,TRIM)
	b(d,"SaiaTrabalhada",Vector3(0,0.98,0.73),Vector3(3.65,0.36,0.12),OAK)
	for x in [-1.35,-0.67,0,0.67,1.35]:
		b(d,"PainelSecretaria",Vector3(x,0.98,0.80),Vector3(0.55,0.23,0.025),TRIM)
		var n = b(d,"Entalhe",Vector3(x,0.98,0.82),Vector3(0.12,0.12,0.02),BRASS)
		n.rotation.z = PI/4
	for x in [-1.75,1.75]:
		candle(d,Vector3(x,1.4,-0.5),false)
	b(d,"PergaminhoGrande",Vector3(0,1.39,0),Vector3(1.55,0.02,1.07),PAPER)
	for i in range(9):
		b(d,"Escrita",Vector3(-0.16,1.405,-0.43+i*0.095),Vector3(0.9-float(i%3)*0.13,0.008,0.015),TRIM)
	h.round_shape(d,"SeloCera",Vector3(0.53,1.415,0.34),0.105,0.025,RED)
	for i in range(3):
		b(d,"LivroEmpilhado",Vector3(-1.12,1.44+i*0.11,0.27),Vector3(0.62,0.10,0.82),[RED,OAK,TRIM][i])
	for x in [0.95,1.2]:
		scroll(d,Vector3(x,1.45,-0.30))
	h.round_shape(d,"Tinteiro",Vector3(1.12,1.45,0.37),0.11,0.15,Color("2d454e"))
	rod(d,Vector3(1.12,1.5,0.37),Vector3(1.30,1.95,0.37),0.016,OAK)
	var feather = h.ball(d,Vector3(1.28,1.88,0.37),Vector3(0.10,0.35,0.035),PAPER)
	feather.rotation.z = -0.36

func chair(p: Node3D, pos: Vector3) -> void:
	var c = h.pivot(p,"CadeiraDoFeitor",pos)
	b(c,"Assento",Vector3(0,0.63,0),Vector3(1.02,0.17,0.84),OAK)
	b(c,"Almofada",Vector3(0,0.75,0),Vector3(0.86,0.16,0.72),RED)
	b(c,"Espaldar",Vector3(0,1.42,-0.37),Vector3(1.02,1.5,0.18),OAK)
	b(c,"Estofo",Vector3(0,1.44,-0.25),Vector3(0.78,1.21,0.11),RED)
	for side in [-1,1]:
		rod(c,Vector3(side*0.43,0.12,-0.32),Vector3(side*0.43,2.22,-0.32),0.065,TRIM)
		h.ball(c,Vector3(side*0.43,2.25,-0.32),Vector3(0.15,0.18,0.15),BRASS)
		rod(c,Vector3(side*0.43,0.1,0.3),Vector3(side*0.43,1.1,0.3),0.065,OAK)
		b(c,"ApoioBraco",Vector3(side*0.5,1.12,0),Vector3(0.14,0.10,0.86),TRIM)
	for y in [1.0,1.4,1.8]:
		for x in [-0.27,0,0.27]:
			h.ball(c,Vector3(x,y,-0.18),Vector3(0.035,0.035,0.02),BRASS)

func bookcase(p: Node3D, pos: Vector3) -> void:
	var shelf = h.pivot(p,"Biblioteca",pos)
	b(shelf,"Fundo",Vector3(0,1.65,0),Vector3(3.1,3.3,0.22),OAK.darkened(0.12))
	for x in [-1.5,1.5]:
		b(shelf,"Ilharga",Vector3(x,1.65,0.23),Vector3(0.17,3.4,0.68),OAK)
	for y in [0.2,0.95,1.7,2.45,3.25]:
		b(shelf,"Prateleira",Vector3(0,y,0.23),Vector3(3.2,0.13,0.78),TRIM)
		if y > 3:
			continue
		for i in range(12):
			var book = h.pivot(shelf,"Volume",Vector3(-1.3+i*0.235,y+0.08,0.23))
			var height = 0.43+float(i%3)*0.065
			b(book,"Encadernacao",Vector3(0,height/2,0),Vector3(0.16,height,0.41),[RED,Color("4d7270"),TRIM,Color("525366")][i%4])
			for band in [0.10,height-0.09]:
				b(book,"NervuraDourada",Vector3(0,band,0.212),Vector3(0.16,0.022,0.013),BRASS)

func wall_map(p: Node3D, pos: Vector3) -> void:
	var map = h.pivot(p,"CartaDeNavegacao",pos)
	b(map,"Moldura",Vector3.ZERO,Vector3(4.4,2.55,0.16),OAK)
	b(map,"Filete",Vector3(0,0,0.10),Vector3(4.19,2.34,0.055),BRASS)
	b(map,"Papel",Vector3(0,0,0.145),Vector3(4.04,2.19,0.035),PAPER)
	for i in range(9):
		b(map,"Meridiano",Vector3(-1.8+i*0.45,0,0.169),Vector3(0.008,2.06,0.004),TRIM.lightened(0.25))
	for i in range(5):
		b(map,"Paralelo",Vector3(0,-0.9+i*0.45,0.17),Vector3(3.9,0.008,0.004),TRIM.lightened(0.25))
	for v in [Vector3(-1.3,0.35,0),Vector3(-1.0,0.04,0),Vector3(-0.85,-0.44,0),Vector3(0.2,0.5,0),Vector3(0.5,0.1,0),Vector3(0.72,-0.25,0),Vector3(1.05,0.48,0),Vector3(1.5,0.4,0)]:
		h.ball(map,Vector3(v.x,v.y,0.185),Vector3(0.52,0.41,0.02),Color("83937a"))
	for i in range(8):
		var angle = i*TAU/8
		rod(map,Vector3(-1.4,-0.65,0.21),Vector3(-1.4+sin(angle)*0.24,-0.65+cos(angle)*0.24,0.21),0.012,OAK)

func globe(p: Node3D, pos: Vector3, variant: int = 0) -> void:
	var g = h.pivot(p,"GloboArmilar",pos)
	var ocean: Color = [Color("669597"),Color("c5ae79"),Color("466b87")][variant]
	var land: Color = [PAPER,Color("718269"),Color("d7c694")][variant]
	var wood: Color = OAK.darkened(0.18) if variant == 2 else OAK
	if variant == 2:
		h.round_shape(g,"PeDoPedestal",Vector3(0,0.12,0),0.46,0.18,wood)
		h.round_shape(g,"ColunaTorneada",Vector3(0,0.59,0),0.11,0.85,wood)
		for y in [0.25,0.88]:
			h.round_shape(g,"AnelDoPedestal",Vector3(0,y,0),0.17,0.07,BRASS)
	else:
		for i in range(3):
			var a = i*TAU/3
			rod(g,Vector3(sin(a)*0.5,0.10,cos(a)*0.5),Vector3(0,1.1,0),0.06,wood)
		if variant == 1:
			h.torus(g,Vector3(0,0.35,0),0.35,0.035,wood)
	var sphere = h.pivot(g,"EsferaCartografica",Vector3(0,1.35,0))
	sphere.rotation = Vector3(0,[0.0,0.65,-0.5][variant],[0.0,0.18,-0.12][variant])
	h.ball(sphere,Vector3.ZERO,Vector3(1.05,1.05,1.05),ocean)
	for i in range(2 if variant == 2 else 3):
		var ring = h.torus(g,Vector3(0,1.35,0),0.61,0.025,BRASS)
		ring.rotation = Vector3(PI/2 if i == 0 else 0,0,0.5 if i == 2 else 0)
	for pos2 in [Vector3(-0.15,1.6,0.4),Vector3(0.2,1.35,0.47),Vector3(0.05,1.16,0.45)]:
		h.ball(sphere,pos2-Vector3(0,1.35,0),Vector3(0.28,0.24,0.08),land)
	if variant == 1:
		g.scale = Vector3.ONE*1.2

func candle(p: Node3D, pos: Vector3, wall: bool) -> void:
	var c = h.pivot(p,"Castical",pos)
	if wall:
		b(c,"Suporte",Vector3(0,0,-0.2),Vector3(0.18,0.36,0.14),OAK)
		rod(c,Vector3(0,-0.12,-0.2),Vector3(0,0,0.16),0.035,BRASS)
	h.round_shape(c,"Base",Vector3.ZERO,0.17,0.055,BRASS)
	rod(c,Vector3(0,0,0),Vector3(0,0.23,0),0.045,BRASS)
	h.round_shape(c,"Cera",Vector3(0,0.36,0),0.065,0.3,PAPER)
	var flame = h.ball(c,Vector3(0,0.57,0),Vector3(0.08,0.20,0.08),Color("ffce74"))
	var mat = h.material(Color("ffce74"))
	mat.emission_enabled = true
	mat.emission = Color("ffad42")
	mat.emission_energy_multiplier = 1.2
	flame.material_override = mat
	var light := OmniLight3D.new()
	light.light_color = Color("ffd49b")
	light.light_energy = 0.32
	light.omni_range = 2.2
	c.add_child(light)
	light.position.y = 0.65

func scroll(p: Node3D, pos: Vector3) -> void:
	var n = h.round_shape(p,"PergaminhoEnrolado",pos,0.07,0.58,PAPER)
	n.rotation.x = PI/2
	var ring = h.torus(p,pos,0.072,0.012,RED)
	ring.rotation.x = PI/2

func stool(p: Node3D, pos: Vector3) -> void:
	h.round_shape(p,"Banco",pos+Vector3(0,0.55,0),0.33,0.12,OAK)
	for i in range(3):
		var a = i*TAU/3
		rod(p,pos+Vector3(sin(a)*0.27,0.08,cos(a)*0.27),pos+Vector3(sin(a)*0.2,0.52,cos(a)*0.2),0.04,TRIM)

func chest(p: Node3D, pos: Vector3) -> void:
	b(p,"Arca",pos+Vector3(0,0.40,0),Vector3(1.45,0.8,0.9),OAK)
	b(p,"Tampa",pos+Vector3(0,0.85,0),Vector3(1.5,0.16,0.94),TRIM)
	for x in [-0.5,0.5]:
		b(p,"CintaArca",pos+Vector3(x,0.46,0.465),Vector3(0.085,0.82,0.025),BRASS)
		b(p,"CintaTampa",pos+Vector3(x,0.94,0),Vector3(0.085,0.02,0.94),BRASS)
	b(p,"Fechadura",pos+Vector3(0,0.65,0.48),Vector3(0.16,0.2,0.025),BRASS)

func plant(p: Node3D, pos: Vector3) -> void:
	h.round_shape(p,"Vaso",pos+Vector3(0,0.27,0),0.28,0.5,Color("a86e53"),0.38)
	for i in range(9):
		var a = i*TAU/9
		var leaf = h.ball(p,pos+Vector3(sin(a)*0.23,0.84+float(i%2)*0.15,cos(a)*0.23),Vector3(0.2,0.8,0.28),Color("607c59").lightened(float(i%3)*0.035))
		leaf.rotation = Vector3(cos(a)*0.45,a,-sin(a)*0.45)
