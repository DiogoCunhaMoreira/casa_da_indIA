@tool
extends "res://scripts/gabinete.gd"
## Sala coletiva: oito postos, arquivo de registos e percursos livres.

func build(host: Node3D, world: Node3D) -> void:
	h = host
	var room = h.pivot(world,"SalaDosEscrivaes",Vector3.ZERO)
	b(room,"Embasamento",Vector3(0,-0.28,0),Vector3(16.5,0.55,10.5),Color("a69880"))
	for x in range(25):
		for z in range(16):
			b(room,"Ladrilho",Vector3(-7.8+x*0.65,0.02,-4.875+z*0.65),Vector3(0.633,0.06,0.633),Color("b68d6b").lightened(float((x*3+z*7)%6)*0.012))
	b(room,"ParedeNorte",Vector3(0,2.35,-5.12),Vector3(16.4,4.7,0.28),PLASTER)
	b(room,"ParedePoente",Vector3(-8.1,2.35,0),Vector3(0.25,4.7,10.4),PLASTER)
	b(room,"CorteNascente",Vector3(8.1,0.4,0),Vector3(0.25,0.8,10.4),PLASTER)
	for y in [0.14,1.12,4.48,4.68]:
		b(room,"Friso",Vector3(0,y,-4.91),Vector3(16.1,0.12,0.22),OAK)
		b(room,"FrisoLateral",Vector3(-7.94,y,0),Vector3(0.22,0.12,10.1),OAK)
	for i in range(40):
		var x = -7.8+i*0.4
		b(room,"Azulejo",Vector3(x,0.65,-4.93),Vector3(0.385,0.75,0.05),PAPER)
		var tile = b(room,"MotivoAzul",Vector3(x,0.65,-4.89),Vector3(0.12,0.12,0.025),Color("507d88"))
		tile.rotation.z = PI/4
	for x in [-7.8,-2.7,2.7,7.8]:
		b(room,"Pilastra",Vector3(x,2.3,-4.78),Vector3(0.24,4.6,0.35),TRIM)
		b(room,"Consola",Vector3(x,4.35,-4.52),Vector3(0.3,0.27,0.86),OAK)
	window(room,-2.4)
	window(room,1.6)
	for x in [-5.15,0,5.15]:
		var archive = h.pivot(room,"ArquivoDiferenciado",Vector3(x,0,-4.2))
		bookcase(archive,Vector3.ZERO)
		style_archive(archive,0 if x < 0 else (1 if x == 0 else 2))
		# Letreiros de arquivo em suportes de madeira.
		b(room,"PlacaArquivo",Vector3(x,3.54,-4.14),Vector3(2.3,0.36,0.10),OAK)
		var title := Label3D.new()
		title.text = "REGISTOS" if x < 0 else ("CORRESPONDÊNCIA" if x == 0 else "CARGAS E CONTAS")
		title.font_size = 40
		title.pixel_size = 0.0029
		title.modulate = PAPER
		room.add_child(title)
		title.position = Vector3(x,3.54,-4.075)
	for x in [-2.6,2.6]:
		candle(room,Vector3(x,2.6,-4.45),true)
		b(room,"QuadroDeRecados",Vector3(x,1.6,-4.64),Vector3(1.25,1.2,0.08),OAK)
		for i in range(3):
			var note = b(room,"Aviso",Vector3(x-0.32+i*0.3,1.6+float(i%2)*0.14,-4.58),Vector3(0.32,0.62,0.02),PAPER)
			note.rotation.z = (i-1)*0.07
			for line in range(4):
				b(room,"LinhaRecado",Vector3(x-0.32+i*0.3,1.45+line*0.085+float(i%2)*0.14,-4.56),Vector3(0.20,0.014,0.008),TRIM)
	for row in range(2):
		for column in range(4):
			workstation(room,Vector3(-5.4+column*3.6,0,-1.8+row*3.3),row*4+column)
	# Passadeiras marcam os corredores entre as mesas.
	h.room_rug(room,Vector3(-2.25,0,-0.2),Vector3(0.82,0.022,5.3),Color("527b7b"))
	h.room_rug(room,Vector3(2.25,0,1.6),Vector3(0.82,0.022,3.2),Color("75816c"))
	plant(room,Vector3(-7.0,0,-2.9))
	chest(room,Vector3(7.35,0,4.3))
	# Mesa estreita de consulta, encostada ao lado nascente.
	var consultation = h.pivot(room,"MesaDeConsulta",Vector3(7.1,0,-1.2))
	consultation.rotation.y = PI/2
	h.desk(consultation,Vector3.ZERO)
	b(consultation,"CartaDeConsulta",Vector3(0,1.03,0),Vector3(1.35,0.02,0.74),PAPER)
	for i in range(5):
		rod(consultation,Vector3(-0.55+i*0.25,1.05,-0.28),Vector3(-0.35+i*0.25,1.05,0.25),0.008,TRIM)
	for i in range(4):
		scroll(room,Vector3(-7.0,0.5+i*0.12,0.0))
	b(room,"CaixaDeRolos",Vector3(-7.0,0.28,0.0),Vector3(0.65,0.52,0.85),OAK)

func workstation(p: Node3D, pos: Vector3, index: int) -> void:
	var d = h.pivot(p,"Posto%02d" % (index+1),pos)
	b(d,"Tampo",Vector3(0,1.05,0),Vector3(2.65,0.15,1.25),OAK)
	b(d,"Rebordo",Vector3(0,1.135,0),Vector3(2.72,0.045,1.32),TRIM)
	b(d,"Resguardo",Vector3(0,1.165,0),Vector3(2.32,0.025,1.00),[Color("526e65"),Color("756349"),Color("526b78")][index%3])
	for x in [-1.05,1.05]:
		for z in [-0.43,0.43]:
			rod(d,Vector3(x,0.1,z),Vector3(x,0.97,z),0.075,OAK)
			for y in [0.15,0.78]:
				h.round_shape(d,"Anel",Vector3(x,y,z),0.10,0.06,TRIM)
	b(d,"Travessa",Vector3(0,0.32,-0.42),Vector3(2.14,0.10,0.10),OAK)
	b(d,"Gaveta",Vector3(0,0.9,0.52),Vector3(0.95,0.24,0.17),TRIM.darkened(0.12))
	h.ball(d,Vector3(0,0.9,0.62),Vector3(0.12,0.065,0.045),BRASS)
	# Cada posto tem um conjunto fixo de objetos, sem aleatoriedade por arranque.
	var work = h.pivot(d,"Documentos",Vector3(0,0,0))
	work.rotation.y = [-0.10,0.07,0.0,0.12,-0.06,0.04][index%6]
	if index in [0,3,5]:
		b(work,"CapaRegisto",Vector3(-0.15,1.20,0.10),Vector3(1.05,0.05,0.76),RED if index == 0 else OAK)
		for side in [-1.0,1.0]:
			b(work,"Pagina",Vector3(-0.15+side*0.255,1.237,0.1),Vector3(0.49,0.025,0.70),PAPER)
			for i in range(7):
				b(work,"Escrita",Vector3(-0.15+side*0.255,1.254,-0.17+i*0.082),Vector3(0.35-float(i%3)*0.035,0.006,0.011),TRIM)
	else:
		for i in range(3 if index == 1 else 1):
			var sheet = h.pivot(work,"FolhaSolta",Vector3(-0.2+i*0.12,1.19+i*0.012,0.05))
			sheet.rotation.y = i*0.12
			b(sheet,"Papel",Vector3.ZERO,Vector3(0.88,0.01,0.74),PAPER)
			for line in range(6):
				b(sheet,"Linha",Vector3(-0.04,0.008,-0.26+line*0.09),Vector3(0.58,0.006,0.012),TRIM)
	if index in [0,2,5]:
		for i in range(1+index%3):
			var volume = b(d,"Volume",Vector3(-0.95,1.23+i*0.10,-0.08),Vector3(0.40,0.09,0.66),[Color("56777c"),RED,TRIM][i])
			volume.rotation.y = (i-1)*0.08
	else:
		for i in range(2):
			scroll(d,Vector3(-0.93+i*0.18,1.25,-0.08))
	var ink = h.pivot(d,"MaterialEscrita",Vector3(0.80 if index%2 == 0 else 0.98,0,0.30 if index%2 == 0 else -0.24))
	h.round_shape(ink,"Tinteiro",Vector3(0,1.24,0),0.085,0.14,Color("2d454e"))
	rod(ink,Vector3(0,1.26,0),Vector3(0.13,1.70,0),0.012,OAK)
	var feather = h.ball(ink,Vector3(0.11,1.62,0),Vector3(0.09,0.30,0.03),PAPER)
	feather.rotation.z = -0.3
	if index in [0,4]:
		scroll(d,Vector3(0.76,1.25,-0.30))
	if index in [1,3,5]:
		h.round_shape(d,"Selo",Vector3(0.45,1.205,0.39),0.065,0.02,RED)
		rod(d,Vector3(0.65,1.19,0.36),Vector3(0.65,1.35,0.36),0.035,OAK)
	if index == 2:
		h.round_shape(d,"Taca",Vector3(0.78,1.25,-0.3),0.11,0.16,TRIM)
		h.round_shape(d,"InteriorTaca",Vector3(0.78,1.333,-0.3),0.085,0.005,OAK)
	if index == 4:
		rod(d,Vector3(-0.50,1.20,0.44),Vector3(0.40,1.20,0.44),0.023,BRASS)
	# Postos vazios com bancos puxados; postos ocupados com o banco recolhido.
	# Mantém livre a posição do oficial e o percurso à direita da mesa.
	var stool_positions := [
		Vector3(-0.20,0,0.92), Vector3(0.55,0,1.15), Vector3(-0.65,0,0.38),
		Vector3(-1.02,0,1.12), Vector3(-0.25,0,0.12), Vector3(-1.08,0,0.62),
	]
	var seat = h.pivot(d,"BancoDeslocado",stool_positions[index%6])
	seat.rotation.y = [-0.18,0.35,-0.10,0.22,-0.30,0.12][index%6]
	stool(seat,Vector3.ZERO)

func style_archive(parent: Node3D, variant: int) -> void:
	var shelf = parent.get_child(0)
	var count := 0
	for child in shelf.get_children():
		if not String(child.name).begins_with("Volume"):
			continue
		var row := count / 12
		var slot := count % 12
		count += 1
		var clear := (variant == 0 and slot >= 9) or (variant == 1 and (row == 1 or row == 3)) or (variant == 2 and slot >= 5)
		if clear:
			shelf.remove_child(child)
			child.free()
			continue
		child.scale.y = 0.78+float((slot+variant*2)%5)*0.07
		if slot == 0 or slot == 7:
			child.rotation.z = 0.12 if variant != 1 else -0.10
	for row in range(4):
		var y: float = [0.2,0.95,1.7,2.45][row]+0.08
		if variant == 0:
			for i in range(2+row%2):
				var book = b(shelf,"PilhaHorizontal",Vector3(1.10,y+0.045+i*0.10,0.23),Vector3(0.52,0.09,0.42),RED if i%2 == 0 else TRIM)
				book.rotation.y = i*0.07
		elif variant == 1 and row in [1,3]:
			for i in range(5):
				scroll(shelf,Vector3(-1.02+i*0.42,y+0.07,0.22))
				if i%2 == 0:
					scroll(shelf,Vector3(-1.02+i*0.42,y+0.20,0.22))
		elif variant == 2:
			for i in range(2 if row%2 == 0 else 1):
				var x := 0.36+i*0.72
				b(shelf,"CaixaDocumentos",Vector3(x,y+0.20,0.23),Vector3(0.62,0.40,0.44),TRIM.darkened(0.12))
				b(shelf,"TampaCaixa",Vector3(x,y+0.42,0.23),Vector3(0.65,0.05,0.47),OAK)
				b(shelf,"EtiquetaCaixa",Vector3(x,y+0.21,0.458),Vector3(0.24,0.10,0.012),PAPER)
