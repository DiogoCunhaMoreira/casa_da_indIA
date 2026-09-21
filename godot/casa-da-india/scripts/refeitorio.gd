@tool
extends "res://scripts/gabinete.gd"
## Refeitório e adega: refeições, loiça, água e barris de reserva.

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"RefeitorioEAdega",Vector3.ZERO)
	b(room,"Fundacao",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	for x in range(25):
		for z in range(16):
			b(room,"Terracota",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.633,0.06,0.633),Color("ba8867").lightened(float((x*3+z*7)%6)*0.013))
	b(room,"ParedeNorte",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedePoente",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteNascente",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for y in [0.16,1.15,4.5,4.7]:
		b(room,"Friso",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoLateral",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for x in [-7.8,-3.8,2.5,7.8]:
		b(room,"Pilar",Vector3(x,2.3,-4.85),Vector3(0.22,4.6,0.35),OAK)
	window(room,-1.6)
	window(room,2.0)
	# Lareira de pedra, no fundo, com brasas discretas.
	var hearth = h.pivot(room,"Lareira",Vector3(-5.9,0,-4.25))
	b(hearth,"PedraBase",Vector3(0,0.17,0.25),Vector3(2.85,0.25,1.35),Color("a89c86"))
	b(hearth,"FundoEscuro",Vector3(0,1.2,-0.40),Vector3(2.25,1.8,0.10),Color("423a32"))
	for side in [-1,1]:
		b(hearth,"Ombreira",Vector3(side*1.13,1.03,0),Vector3(0.30,1.95,0.95),Color("b9ac91"))
	b(hearth,"Verga",Vector3(0,2.04,0),Vector3(2.72,0.30,1.08),Color("c6b696"))
	b(hearth,"Chamine",Vector3(0,3.2,-0.1),Vector3(2.28,2.02,0.82),PLASTER)
	for i in range(3):
		rod(hearth,Vector3(-0.75,0.38+i*0.10,-0.20+i*0.20),Vector3(0.73,0.38+i*0.10,0.04+i*0.14),0.10,OAK.darkened(0.3))
	for i in range(5):
		var ember = h.ball(hearth,Vector3(-0.5+i*0.25,0.43,0.22),Vector3(0.20,0.12,0.15),Color("d3793c"))
		var mat = h.material(Color("d3793c"))
		mat.emission_enabled = true
		mat.emission = Color("ab4825")
		ember.material_override = mat
	var glow := OmniLight3D.new()
	glow.light_color = Color("ffc18c")
	glow.light_energy = 0.45
	glow.omni_range = 3.0
	hearth.add_child(glow)
	glow.position = Vector3(0,0.9,0.4)
	# Balcão com cântaros e loiça, acessível pelo corredor central.
	var counter = h.pivot(room,"BalcaoDeServir",Vector3(-0.5,0,-4.0))
	b(counter,"Base",Vector3(0,0.54,0),Vector3(4.8,1.08,1.10),OAK)
	b(counter,"Tampo",Vector3(0,1.15,0),Vector3(5.05,0.14,1.32),TRIM)
	for x in [-1.7,-0.6,0.6,1.7]:
		b(counter,"Painel",Vector3(x,0.59,0.57),Vector3(0.93,0.75,0.06),TRIM.darkened(0.12))
	jug(counter,Vector3(-1.75,1.25,0),0.8)
	jug(counter,Vector3(-0.95,1.25,0.10),0.62)
	for i in range(4):
		plate(counter,Vector3(0.10,1.25+i*0.045,0.12))
	for i in range(3):
		cup(counter,Vector3(0.95+i*0.36,1.25,-0.13+float(i%2)*0.25))
	for y in [2.1,2.95]:
		b(room,"PrateleiraLoica",Vector3(-0.5,y,-4.55),Vector3(4.9,0.11,0.70),TRIM)
		for i in range(5):
			if y < 2.5:
				cup(room,Vector3(-2.1+i*0.73,y+0.07,-4.43))
			else:
				jug(room,Vector3(-2.1+i*0.80,y+0.07,-4.43),0.40+float(i%3)*0.08)
	# Adega com barris em duas escalas, sem repetir a mesma fila.
	var cellar = h.pivot(room,"Adega",Vector3(5.2,0,-3.8))
	for i in range(4):
		var barrel = h.pivot(cellar,"Barril",Vector3(-1.5+i*1.0,0,0.15*float(i%2)))
		barrel.scale = Vector3.ONE*(1.1+float(i%3)*0.15)
		h.barrel(barrel,Vector3.ZERO)
		rod(barrel,Vector3(0,0.43,0.35),Vector3(0,0.43,0.52),0.035,BRASS)
	b(cellar,"PrateleiraGarrafas",Vector3(0,2.2,-0.6),Vector3(4.15,0.14,0.66),OAK)
	for i in range(7):
		var x := -1.7+i*0.54
		h.round_shape(cellar,"Garrafa",Vector3(x,2.5,-0.55),0.12,0.45,Color("526f59"),0.09)
		h.round_shape(cellar,"Gargalo",Vector3(x,2.80,-0.55),0.045,0.18,Color("526f59"))
	dining_table(room,Vector3(-3.3,0,0.4),false)
	dining_table(room,Vector3(3.6,0,0.9),true)
	bench(room,Vector3(-3.4,0,-0.78),-0.04,2.75)
	bench(room,Vector3(-3.65,0,1.8),0.09,2.5)
	bench(room,Vector3(3.7,0,-0.30),0.04,2.30)
	stool(room,Vector3(4.6,0,2.2))
	stool(room,Vector3(5.5,0,0.9))
	var basket = h.pivot(room,"CestoDeLenha",Vector3(-6.9,0,-2.1))
	b(basket,"Caixa",Vector3(0,0.25,0),Vector3(0.85,0.50,0.8),OAK)
	for i in range(4):
		rod(basket,Vector3(-0.3+i*0.19,0.3,-0.3),Vector3(-0.3+i*0.19,0.75,0.2),0.07,TRIM)
	jug(room,Vector3(7.0,0.1,3.8),1.4)

func dining_table(p: Node3D, pos: Vector3, small: bool) -> void:
	var table = h.pivot(p,"MesaRefeicao",pos)
	var width := 2.9 if small else 3.5
	for i in range(4):
		b(table,"Tabua",Vector3(0,1.03,-0.56+i*0.37),Vector3(width,0.13,0.35),OAK.lightened(float(i%3)*0.03))
	for x in [-width/2+0.3,width/2-0.3]:
		for z in [-0.45,0.45]:
			rod(table,Vector3(x,0.10,z),Vector3(x,0.98,z),0.075,TRIM)
	if not small:
		b(table,"Pano",Vector3(0.35,1.108,0),Vector3(0.90,0.012,1.43),PAPER)
		jug(table,Vector3(0.4,1.12,-0.25),0.62)
	for i in range(2 if small else 3):
		var x := -0.95+i*(1.5 if small else 0.90)
		plate(table,Vector3(x,1.12,0.12 if i%2 == 0 else -0.15))
		cup(table,Vector3(x+0.25,1.12,-0.42 if i%2 == 0 else 0.46))
	var loaf = h.ball(table,Vector3(0.1 if small else -0.75,1.22,-0.38),Vector3(0.5,0.20,0.26),Color("c29455"))
	loaf.rotation.y = 0.22

func bench(p: Node3D, pos: Vector3, angle: float, width: float) -> void:
	var seat = h.pivot(p,"BancoComprido",pos)
	seat.rotation.y = angle
	b(seat,"Assento",Vector3(0,0.55,0),Vector3(width,0.14,0.42),TRIM)
	for side in [-1,1]:
		b(seat,"Pe",Vector3(side*(width/2-0.25),0.28,0),Vector3(0.16,0.5,0.36),OAK)

func plate(p: Node3D, pos: Vector3) -> void:
	h.round_shape(p,"Prato",pos+Vector3(0,0.025,0),0.23,0.035,PAPER)
	h.torus(p,pos+Vector3(0,0.047,0),0.21,0.015,Color("6d9192"))

func cup(p: Node3D, pos: Vector3) -> void:
	h.round_shape(p,"Caneca",pos+Vector3(0,0.12,0),0.10,0.22,Color("ac7955"))
	h.round_shape(p,"Interior",pos+Vector3(0,0.233,0),0.076,0.006,OAK)
	var handle = h.torus(p,pos+Vector3(0.13,0.13,0),0.07,0.02,Color("ac7955"))
	handle.rotation.x = PI/2

func jug(p: Node3D, pos: Vector3, size: float) -> void:
	var vessel = h.pivot(p,"Cantaro",pos)
	vessel.scale = Vector3.ONE*size
	h.ball(vessel,Vector3(0,0.30,0),Vector3(0.55,0.62,0.5),Color("b57d58"))
	h.round_shape(vessel,"Colo",Vector3(0,0.60,0),0.13,0.23,Color("b57d58"),0.16)
	h.torus(vessel,Vector3(0,0.73,0),0.15,0.026,PAPER)
	var handle = h.torus(vessel,Vector3(0.28,0.4,0),0.19,0.045,Color("b57d58"))
	handle.rotation.x = PI/2
