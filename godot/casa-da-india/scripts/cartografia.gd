@tool
extends "res://scripts/gabinete.gd"
## Oficina de cartas: mesa oblíqua, arquivo horizontal e instrumentos.

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"CartografiaERoteiros",Vector3.ZERO)
	b(room,"Fundacao",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	for x in range(25):
		for z in range(16):
			b(room,"Ladrilho",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.633,0.06,0.633),Color("b79872").lightened(float((x*3+z*7)%5)*0.014))
	b(room,"ParedeNorte",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedePoente",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteNascente",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for y in [0.15,1.1,4.5,4.7]:
		b(room,"FrisoNorte",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoLateral",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for x in [-7.8,-2.7,3.0,7.8]:
		b(room,"Pilastra",Vector3(x,2.3,-4.85),Vector3(0.24,4.6,0.35),TRIM)
		b(room,"Consola",Vector3(x,4.35,-4.5),Vector3(0.30,0.28,0.85),OAK)
	window(room,-2.4)
	window(room,1.5)
	wall_map(room,Vector3(0,2.95,-4.78))
	flat_archive(room,Vector3(-5.1,0,-4.0))
	roll_rack(room,Vector3(5.3,0,-4.0))
	for x in [-2.6,2.8]:
		candle(room,Vector3(x,2.35,-4.45),true)
	# A mesa está ligeiramente rodada; não repete a sala de reuniões.
	var table = h.pivot(room,"MesaDeDesenho",Vector3(-1.15,0,0.05))
	table.rotation.y = -0.12
	for x in [-1.6,1.6]:
		for side in [-1,1]:
			rod(table,Vector3(x,0.10,side*0.82),Vector3(x,1.08,side*0.52),0.10,OAK)
		b(table,"Cavalete",Vector3(x,0.40,0),Vector3(0.14,0.12,1.45),TRIM)
	b(table,"Tampo",Vector3(0,1.16,0),Vector3(4.9,0.16,2.45),OAK)
	b(table,"Rebordo",Vector3(0,1.25,0),Vector3(5.0,0.045,2.52),TRIM)
	var chart = h.pivot(table,"CartaEmProgresso",Vector3(-0.30,1.29,0.02))
	chart.rotation.y = 0.06
	drawing(chart,Vector3(3.0,0.014,1.95))
	for z in [-0.99,0.99]:
		var curl = h.round_shape(chart,"BordoEnrolado",Vector3(0,0.035,z),0.04,3.02,PAPER)
		curl.rotation.z = PI/2
	rod(table,Vector3(-1.5,1.33,0.98),Vector3(0.65,1.33,0.98),0.022,BRASS)
	rod(table,Vector3(1.45,1.32,0.30),Vector3(1.80,1.32,-0.32),0.018,BRASS)
	rod(table,Vector3(1.80,1.32,-0.32),Vector3(2.08,1.32,0.32),0.018,BRASS)
	h.round_shape(table,"Tinteiro",Vector3(2.0,1.36,-0.78),0.10,0.15,Color("294954"))
	for i in range(3):
		scroll(table,Vector3(-2.07+i*0.19,1.36,-0.2))
	stool(room,Vector3(-2.8,0,1.75))
	globe(room,Vector3(-5.85,0,0.7))
	# Instrumento armilar em pedestal independente, à direita.
	var instrument = h.pivot(room,"InstrumentoArmilar",Vector3(5.2,0,2.7))
	h.round_shape(instrument,"Base",Vector3(0,0.13,0),0.50,0.18,OAK)
	rod(instrument,Vector3(0,0.2,0),Vector3(0,1.15,0),0.10,TRIM)
	for i in range(3):
		var ring = h.torus(instrument,Vector3(0,1.62,0),0.65,0.035,BRASS)
		ring.rotation = [Vector3.ZERO,Vector3(PI/2,0,0),Vector3(0,0,0.65)][i]
	h.ball(instrument,Vector3(0,1.62,0),Vector3(0.14,0.14,0.14),BRASS)
	rod(instrument,Vector3(0,0.94,0),Vector3(0,2.30,0),0.025,BRASS)
	var consult = h.pivot(room,"PostoDeRoteiros",Vector3(4.75,0,-1.45))
	h.desk(consult,Vector3.ZERO)
	for i in range(3):
		var volume = b(consult,"LivroDeRoteiros",Vector3(-0.63,1.07+i*0.09,0.12),Vector3(0.5,0.08,0.6),RED if i%2 == 0 else TRIM)
		volume.rotation.y = i*0.06
	stool(room,Vector3(5.7,0,-0.55))
	plant(room,Vector3(7.0,0,-2.9))
	chest(room,Vector3(7.0,0,3.8))
	h.room_rug(room,Vector3(-1.0,0,3.45),Vector3(4.0,0.022,0.85),Color("536f79"))

func drawing(p: Node3D, size: Vector3) -> void:
	b(p,"Pergaminho",Vector3.ZERO,size,PAPER)
	for i in range(8):
		var a = float(i)*TAU/8
		rod(p,Vector3(-0.65,0.016,0.25),Vector3(-0.65+sin(a)*0.62,0.016,0.25+cos(a)*0.62),0.009,TRIM)
	for i in range(13):
		var x = -1.28+i*0.20
		var z = -0.35+sin(i*0.9)*0.13
		rod(p,Vector3(x,0.025,z),Vector3(x+0.20,0.025,-0.35+sin((i+1)*0.9)*0.13),0.018,Color("63807c"))
	for i in range(5):
		h.round_shape(p,"Porto",Vector3(-1.1+i*0.5,0.035,-0.15+sin(i)*0.13),0.035,0.013,RED)
	for i in range(4):
		b(p,"Anotacao",Vector3(0.75,0.022,0.32+i*0.11),Vector3(0.6-i*0.06,0.004,0.015),TRIM)

func flat_archive(p: Node3D, pos: Vector3) -> void:
	var cabinet = h.pivot(p,"ArquivoHorizontal",pos)
	b(cabinet,"Caixa",Vector3(0,0.90,0),Vector3(3.35,1.8,1.12),OAK)
	for row in range(6):
		var z := 0.65 if row != 2 else 0.80
		b(cabinet,"GavetaDeCartas",Vector3(0,0.2+row*0.28,z),Vector3(3.12,0.22,0.15),TRIM.darkened(0.1))
		for x in [-1.1,1.1]:
			h.ball(cabinet,Vector3(x,0.2+row*0.28,z+0.1),Vector3(0.16,0.05,0.06),BRASS)
		b(cabinet,"Etiqueta",Vector3(0,0.2+row*0.28,z+0.08),Vector3(0.30,0.08,0.012),PAPER)
	b(cabinet,"Tampo",Vector3(0,1.86,0),Vector3(3.5,0.13,1.22),TRIM)
	for i in range(3):
		scroll(cabinet,Vector3(-1+i*0.3,1.99,0.1))
	b(cabinet,"Pasta",Vector3(0.75,1.97,0.1),Vector3(0.70,0.10,0.78),Color("526e70"))

func roll_rack(p: Node3D, pos: Vector3) -> void:
	var rack = h.pivot(p,"ArquivoDeRolos",pos)
	b(rack,"Fundo",Vector3(0,1.5,0),Vector3(2.8,3,0.20),OAK)
	for x in [-1.35,-0.45,0.45,1.35]:
		b(rack,"DivisoriaVertical",Vector3(x,1.5,0.32),Vector3(0.10,3.1,0.80),TRIM)
	for y in [0.15,0.88,1.61,2.34,3.07]:
		b(rack,"Prateleira",Vector3(0,y,0.32),Vector3(2.85,0.10,0.85),TRIM)
	for row in range(4):
		for col in range(3):
			if row == 2 and col == 1:
				continue
			for j in range(1+(row+col)%3):
				scroll(rack,Vector3(-1.05+col*0.9+j*0.23,0.27+row*0.73,0.34))
			if col == 0:
				scroll(rack,Vector3(-0.93,0.41+row*0.73,0.34))
