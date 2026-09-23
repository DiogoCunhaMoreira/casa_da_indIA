@tool
extends "res://scripts/gabinete.gd"
## Sala de reunião: mesa única, lugares variados e parede de roteiros.

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"SalaDoConselho",Vector3.ZERO)
	b(room,"Fundacao",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	for x in range(25):
		for z in range(16):
			b(room,"Pedra",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.635,0.06,0.635),Color("c2b294").lightened(float((x*7+z*3)%5)*0.014))
	b(room,"ParedeNorte",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedePoente",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteNascente",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for y in [0.15,1.15,4.5,4.7]:
		b(room,"Friso",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoLateral",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for i in range(20):
		b(room,"Lambrim",Vector3(-7.6+i*0.8,0.65,-4.93),Vector3(0.70,0.86,0.11),OAK)
		b(room,"Painel",Vector3(-7.6+i*0.8,0.65,-4.86),Vector3(0.51,0.60,0.035),TRIM.darkened(0.2))
	for x in [-7.8,-3.1,3.1,7.8]:
		b(room,"Pilar",Vector3(x,2.3,-4.85),Vector3(0.25,4.6,0.35),Color("bead8d"))
		b(room,"Consola",Vector3(x,4.35,-4.52),Vector3(0.32,0.28,0.85),OAK)
	window(room,-2.4)
	window(room,1.5)
	wall_map(room,Vector3(0,2.95,-4.78))
	for x in [-4.6,4.6]:
		b(room,"Pendao",Vector3(x,2.95,-4.88),Vector3(1.40,2.25,0.05),Color("3f6b70") if x < 0 else RED)
		for side in [-1,1]:
			b(room,"Bordado",Vector3(x+side*0.62,2.95,-4.84),Vector3(0.04,2.2,0.015),BRASS)
		rod(room,Vector3(x-0.86,4.16,-4.78),Vector3(x+0.86,4.16,-4.78),0.045,BRASS)
		var emblem = b(room,"Emblema",Vector3(x,3.04,-4.83),Vector3(0.45,0.45,0.04),PAPER)
		emblem.rotation.z = PI/4
		for i in range(10):
			rod(room,Vector3(x-0.62+i*0.14,1.82,-4.86),Vector3(x-0.62+i*0.14,1.66,-4.86),0.015,BRASS)
	for x in [-2.9,2.9]:
		candle(room,Vector3(x,2.4,-4.42),true)
	h.room_rug(room,Vector3(0,0,0.2),Vector3(8.4,0.025,6.3),Color("42696c"))
	for side in [-1.0,1.0]:
		for i in range(25):
			var ornament = b(room,"BordadoTapete",Vector3(-3.9+i*0.325,0.105,0.2+side*2.88),Vector3(0.085,0.012,0.085),PAPER)
			ornament.rotation.y = PI/4
	meeting_table(room)
	# Todos os lugares voltados para a mesa, com recuos e ângulos próprios.
	var seats := [Vector3(-2.35,0,-2.05),Vector3(0.08,0,-2.25),Vector3(2.3,0,-1.98),Vector3(-2.45,0,2.18),Vector3(-0.12,0,2.48),Vector3(2.28,0,2.08)]
	for i in range(seats.size()):
		var seat = h.pivot(room,"LugarConselho",seats[i])
		seat.rotation.y = (0.0 if i < 3 else PI)+[-0.08,0.03,0.10,0.14,-0.09,0.04][i]
		council_chair(seat,i)
	var cupboard = h.pivot(room,"AparadorDeAtas",Vector3(-5.9,0,-3.9))
	b(cupboard,"Movel",Vector3(0,0.7,0),Vector3(2.6,1.4,0.95),OAK)
	b(cupboard,"Tampo",Vector3(0,1.45,0),Vector3(2.75,0.12,1.06),TRIM)
	for x in [-0.85,0,0.85]:
		b(cupboard,"Porta",Vector3(x,0.70,0.5),Vector3(0.73,1.12,0.055),TRIM.darkened(0.12))
		h.ball(cupboard,Vector3(x+0.20,0.78,0.55),Vector3(0.07,0.08,0.05),BRASS)
	for i in range(3):
		var book = b(cupboard,"Atas",Vector3(-0.65,1.56+i*0.10,0),Vector3(0.65,0.09,0.64),RED if i%2 == 0 else Color("496d70"))
		book.rotation.y = i*0.07
	for x in [0.35,0.6,0.85]:
		scroll(cupboard,Vector3(x,1.6,0))
	globe(room,Vector3(6.4,0,-3.7),2)
	plant(room,Vector3(-6.8,0,3.8))
	plant(room,Vector3(7.1,0,-0.4))

func council_chair(p: Node3D, index: int) -> void:
	b(p,"Assento",Vector3(0,0.60,0),Vector3(0.92,0.13,0.78),OAK)
	b(p,"Almofada",Vector3(0,0.70,0),Vector3(0.76,0.12,0.65),RED if index%3 != 1 else Color("8b7552"))
	b(p,"Espaldar",Vector3(0,1.19,-0.33),Vector3(0.86,0.86,0.14),OAK)
	b(p,"Estofo",Vector3(0,1.20,-0.24),Vector3(0.62,0.62,0.08),RED if index%3 != 1 else Color("8b7552"))
	for x in [-0.36,0.36]:
		for z in [-0.30,0.30]:
			rod(p,Vector3(x,0.10,z),Vector3(x,0.6,z),0.045,TRIM)
		rod(p,Vector3(x,0.6,-0.32),Vector3(x,1.73,-0.32),0.04,TRIM)
		h.ball(p,Vector3(x,1.75,-0.32),Vector3(0.10,0.12,0.10),BRASS)

func meeting_table(p: Node3D) -> void:
	var table = h.pivot(p,"MesaDoConselho",Vector3.ZERO)
	b(table,"Rebordo",Vector3(0,1.14,0),Vector3(6.85,0.16,2.85),TRIM)
	for i in range(7):
		b(table,"Tabua",Vector3(0,1.24,-1.20+i*0.40),Vector3(6.7,0.08,0.385),OAK.lightened(float(i%3)*0.018))
	for x in [-2.15,2.15]:
		b(table,"Pedestal",Vector3(x,0.61,0),Vector3(0.28,1.05,1.95),OAK)
		b(table,"PeTravessa",Vector3(x,0.13,0),Vector3(0.70,0.18,2.3),TRIM)
	b(table,"Travamento",Vector3(0,0.42,0),Vector3(4.4,0.15,0.15),TRIM)
	b(table,"PassadeiraMesa",Vector3(0,1.289,0),Vector3(6.55,0.014,0.63),Color("8e4742"))
	var chart = h.pivot(table,"CartaEmDiscussao",Vector3(-0.3,1.31,0))
	chart.rotation.y = -0.12
	b(chart,"Carta",Vector3.ZERO,Vector3(2.40,0.018,1.62),PAPER)
	for i in range(7):
		b(chart,"Meridiano",Vector3(-1.05+i*0.35,0.015,0),Vector3(0.009,0.005,1.49),TRIM)
	for i in range(5):
		b(chart,"Paralelo",Vector3(0,0.017,-0.67+i*0.33),Vector3(2.27,0.005,0.009),TRIM)
	for v in [Vector3(-0.7,0.04,-0.3),Vector3(-0.45,0.04,0.2),Vector3(0.4,0.04,-0.2),Vector3(0.7,0.04,0.15)]:
		h.ball(chart,v,Vector3(0.45,0.025,0.4),Color("869679"))
	for v in [Vector3(-0.7,0.08,0.25),Vector3(0.5,0.08,-0.15),Vector3(0.95,0.08,0.4)]:
		h.round_shape(chart,"MarcadorRota",v,0.045,0.10,RED)
	rod(table,Vector3(-1.25,1.34,0.9),Vector3(0.6,1.34,0.9),0.023,BRASS)
	for i in range(3):
		var paper = b(table,"Ata",Vector3(2.1+i*0.07,1.30+i*0.013,0.30),Vector3(0.85,0.01,0.70),PAPER)
		paper.rotation.y = 0.12+i*0.06
	for x in [-2.8,2.95]:
		candle(table,Vector3(x,1.3,-0.65),false)
	for i in range(2):
		scroll(table,Vector3(-2.5+i*0.25,1.37,0.4))
	h.round_shape(table,"Tinteiro",Vector3(2.90,1.37,0.5),0.10,0.16,Color("294954"))
	h.round_shape(table,"Selo",Vector3(1.58,1.32,0.75),0.08,0.03,RED)
