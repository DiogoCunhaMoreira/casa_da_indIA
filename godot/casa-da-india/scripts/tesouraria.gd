@tool
extends "res://scripts/gabinete.gd"
## Contas e guarda de valores: balcão, balança e cofres distintos.

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"TesourariaEContabilidade",Vector3.ZERO)
	b(room,"Fundacao",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	for x in range(25):
		for z in range(16):
			b(room,"Ladrilho",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.633,0.06,0.633),Color("bdac89").lightened(float((x*3+z*7)%5)*0.015))
	b(room,"ParedeNorte",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedePoente",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteNascente",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for y in [0.15,1.15,4.5,4.7]:
		b(room,"Friso",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoLateral",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for x in range(20):
		b(room,"Lambrim",Vector3(-7.6+x*0.8,0.65,-4.91),Vector3(0.7,0.83,0.09),OAK)
		b(room,"Painel",Vector3(-7.6+x*0.8,0.65,-4.85),Vector3(0.52,0.60,0.03),TRIM.darkened(0.2))
	for x in [-7.8,-2.5,2.8,7.8]:
		b(room,"Pilastra",Vector3(x,2.3,-4.85),Vector3(0.24,4.6,0.35),TRIM)
	window(room,-2.4)
	window(room,1.5)
	# Grades nas janelas, sem fechar a vista do interior.
	for z in [-2.4,1.5]:
		for dz in [-0.6,-0.2,0.2,0.6]:
			rod(room,Vector3(-7.69,1.63,z+dz),Vector3(-7.69,3.66,z+dz),0.022,Color("394747"))
	bookcase(room,Vector3(-5.7,0,-4.15))
	for x in [-2.7,2.7]:
		candle(room,Vector3(x,2.6,-4.4),true)
	# Quadro de contas com colunas e talões, em vez de outro mapa.
	var board = h.pivot(room,"QuadroDeContas",Vector3(0,2.7,-4.8))
	b(board,"Moldura",Vector3.ZERO,Vector3(3.5,2.25,0.14),OAK)
	b(board,"Registo",Vector3(0,0,0.10),Vector3(3.26,2.0,0.035),PAPER)
	for x in [-0.5,0.5]:
		b(board,"Coluna",Vector3(x,0,0.126),Vector3(0.014,1.85,0.008),TRIM)
	for row in range(8):
		for col in range(3):
			b(board,"Lancamento",Vector3(-1.07+col*1.05,0.78-row*0.22,0.13),Vector3(0.66-float((row+col)%3)*0.12,0.025,0.008),TRIM)
	var storage = h.pivot(room,"CofresDeGuarda",Vector3(5.2,0,-3.95))
	for i in range(2):
		var safe = h.pivot(storage,"Cofre",Vector3(-0.95+i*2,0,0.12*i))
		safe.scale = Vector3(1,1.0+i*0.23,1)
		b(safe,"Corpo",Vector3(0,0.85,0),Vector3(1.65,1.7,1.2),Color("465451") if i == 0 else OAK)
		for x in [-0.67,0.67]:
			b(safe,"Ferragem",Vector3(x,0.85,0.62),Vector3(0.12,1.65,0.06),TRIM)
			for y in [0.22,0.65,1.1,1.5]:
				h.ball(safe,Vector3(x,y,0.66),Vector3(0.06,0.06,0.025),BRASS)
		b(safe,"Fechadura",Vector3(0,0.95,0.64),Vector3(0.22,0.35,0.07),BRASS)
		b(safe,"Fenda",Vector3(0,0.98,0.68),Vector3(0.025,0.10,0.015),OAK)
		var handle = h.torus(safe,Vector3(0,0.63,0.71),0.13,0.022,BRASS)
		handle.rotation.x = PI/2
	h.room_rug(room,Vector3(-0.6,0,0.9),Vector3(6.6,0.022,4.1),Color("727957"))
	counter(room)
	var ledger = h.pivot(room,"PostoDeContabilidade",Vector3(5.35,0,0.55))
	h.desk(ledger,Vector3.ZERO)
	for i in range(3):
		b(ledger,"LivroReceita",Vector3(-0.73,1.07+i*0.09,0),Vector3(0.46,0.08,0.64),RED if i%2 == 0 else Color("557471"))
	chest(room,Vector3(-6.6,0,3.6))
	for pos in [Vector3(-6.5,0,2.35),Vector3(-5.75,0,3.55)]:
		h.ball(room,pos+Vector3(0,0.32,0),Vector3(0.50,0.61,0.46),Color("b7a17d"))
		h.round_shape(room,"BocaSaco",pos+Vector3(0,0.64,0),0.09,0.16,PAPER,0.05)
		h.torus(room,pos+Vector3(0,0.60,0),0.09,0.017,OAK)

func counter(p: Node3D) -> void:
	var table = h.pivot(p,"BancadaDeContagem",Vector3(-0.7,0,-0.2))
	b(table,"Base",Vector3(0,0.62,0),Vector3(5.5,1.24,1.35),OAK)
	b(table,"Tampo",Vector3(0,1.31,0),Vector3(5.85,0.15,1.70),TRIM)
	b(table,"Feltro",Vector3(0,1.40,0),Vector3(5.48,0.025,1.36),Color("4e6959"))
	for x in [-2.05,-0.68,0.68,2.05]:
		b(table,"PainelBalcao",Vector3(x,0.68,0.69),Vector3(1.18,0.91,0.05),TRIM.darkened(0.16))
		var motif = b(table,"Entalhe",Vector3(x,0.68,0.73),Vector3(0.23,0.23,0.02),BRASS)
		motif.rotation.z = PI/4
	var scale = h.pivot(table,"Balanca",Vector3(-1.75,1.42,-0.15))
	h.round_shape(scale,"Base",Vector3(0,0.07,0),0.31,0.10,BRASS)
	rod(scale,Vector3(0,0.10,0),Vector3(0,1.18,0),0.045,BRASS)
	rod(scale,Vector3(-0.63,1.04,0),Vector3(0.63,1.13,0),0.035,BRASS)
	for side in [-1.0,1.0]:
		var y = 0.52+side*0.045
		for z in [-0.20,0.20]:
			rod(scale,Vector3(side*0.59,1.085+side*0.045,0),Vector3(side*0.59,y,z),0.012,BRASS)
		h.round_shape(scale,"Prato",Vector3(side*0.59,y,0),0.25,0.045,BRASS)
		h.round_shape(scale,"Peso",Vector3(side*0.59,y+0.07,0),0.07,0.10,OAK if side > 0 else BRASS)
	for i in range(7):
		var x = -0.45+float(i%3)*0.30
		var z = -0.36+float(i/3)*0.30
		for j in range(2+i%4):
			h.round_shape(table,"Moeda",Vector3(x,1.44+j*0.025,z),0.085,0.022,BRASS.lightened(0.08))
	for i in range(4):
		h.round_shape(table,"MoedaSolta",Vector3(0.65+i*0.16,1.44,0.35+sin(i)*0.12),0.075,0.018,BRASS)
	b(table,"LivroAberto",Vector3(1.8,1.46,0.05),Vector3(1.05,0.055,0.88),PAPER)
	for side in [-1.0,1.0]:
		for line in range(7):
			b(table,"Contas",Vector3(1.8+side*0.25,1.493,-0.3+line*0.10),Vector3(0.37,0.006,0.012),TRIM)
	h.round_shape(table,"Selo",Vector3(2.36,1.44,0.47),0.075,0.018,RED)
	scroll(table,Vector3(2.45,1.49,-0.2))
