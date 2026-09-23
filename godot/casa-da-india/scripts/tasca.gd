extends RefCounted
## Original neighbourhood tasca, built with the same procedural primitives as Casa.
const ID = "tasca"
const OVERVIEW = "tasca"
const OVERVIEW_FOCUS = Vector3(0,0.2,1)
const OVERVIEW_SIZE = 43.0
const CENTRES = {"balcao":Vector3(-10,0,-10), "mesas":Vector3(-4,0,0), "cozinha":Vector3(8,0,-10), "despensa":Vector3(12,0,1), "patio":Vector3(0,0,12)}
const SEATS = [0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]
const WOOD = Color("634438")
const MARBLE = Color("e8e1cf")
const BLUE = Color("457c9a")

func seat_position(seat: Variant) -> Vector3:
	if seat == null: return waiting_position(0)
	var n := SEATS.find(int(seat))
	if n == 0: return Vector3(-11,0,-8)
	if n <= 12:
		var table := (n-1)/2
		return Vector3(-10+(table%3)*5.5,0,-2.8+(table/3)*5.8) + Vector3(-1.45 if n%2 == 1 else 1.45,0,0)
	if n <= 16: return Vector3(3+(n-13)*3,0,-8)
	return Vector3(11.5,0,-3+(n-17)*3)

func station_position(station: String, home: Vector3) -> Vector3:
	match station:
		"board": return Vector3(-3.5,0,-8)
		"mailbox": return Vector3(-7,0,-8)
		"web", "mcp": return Vector3(10,0,-5)
		"shelf": return Vector3(11.5,0,6)
	return home

func blocked_position(index: int) -> Vector3:
	return Vector3(-14+float(index%8)*1.6,0,7+float(index/8)*0.7)

func waiting_position(index: int) -> Vector3:
	return Vector3(-12+float(index%12)*2,0,16)

func break_position(stage: String, place: int = 0) -> Vector3:
	if stage == "serve": return Vector3(-12,0,10)
	if stage == "wash": return Vector3(12,0,10)
	return Vector3(-9+place*6,0,13)

func table(h: Node3D, parent: Node3D, at: Vector3) -> void:
	h.box(parent,"MesaMarmore",at+Vector3(0,0.98,0),Vector3(1.8,0.13,1.5),MARBLE)
	h.round_shape(parent,"PeMesa",at+Vector3(0,0.46,0),0.16,0.92,WOOD)
	h.box(parent,"BaseMesa",at+Vector3(0,0.12,0),Vector3(1,0.12,0.9),WOOD)
	h.box(parent,"ToalhaPapel",at+Vector3(0,1.055,0),Vector3(1.65,0.01,1.34),Color("f4ecd8"))
	h.round_shape(parent,"PratoPetiscos",at+Vector3(0.25,1.09,0),0.28,0.045,MARBLE)
	for i in range(4):
		h.ball(parent,at+Vector3(0.12+i*0.09,1.13,0),Vector3(0.11,0.07,0.12),Color("867742"))
	h.round_shape(parent,"Copo",at+Vector3(-0.45,1.15,-0.3),0.08,0.19,Color("a2bbb1"))
	h.round_shape(parent,"JarroVinho",at+Vector3(0.3,1.25,-0.42),0.12,0.37,Color("6e4838"),0.085)

func build(h: Node3D, world: Node3D) -> void:
	var site = h.pivot(world,"CasaCompleta",Vector3.ZERO)
	var room = h.pivot(site,"Tasca",Vector3.ZERO)
	h.box(room,"Fundacao",Vector3(0,-0.25,1),Vector3(33,0.45,32),Color("bca383"))
	for x in range(-16,16):
		for z in range(-14,9):
			var tile := Color("af967e") if (x+z)%2==0 else Color("d4c7b3")
			if x > 0 and z < -6: tile = Color("a5aca6") if (x+z)%2==0 else Color("c8cbc0")
			h.box(room,"Mosaico",Vector3(x+0.5,0,z+0.5),Vector3(0.97,0.04,0.97),tile)
	h.box(room,"Patio",Vector3(0,0.01,12.5),Vector3(32,0.05,9),Color("c6bba7"))
	h.plan_walls_cut = h.pivot(site,"ParedesEmCorte",Vector3.ZERO)
	h.plan_walls_full = h.pivot(site,"ParedesCompletas",Vector3.ZERO)
	for walls in [h.plan_walls_cut,h.plan_walls_full]:
		var height := 0.65 if walls == h.plan_walls_cut else 3.8
		for x in [-16.0,16.0]:
			h.box(walls,"ParedeLateral",Vector3(x,height/2,-2.5),Vector3(0.2,height,23),Color("e5d6b9"))
		h.box(walls,"ParedeFundo",Vector3(0,height/2,-14),Vector3(32,height,0.2),Color("e5d6b9"))
	# Tile wall remains visible above the cutaway; detailed pattern is original geometry.
	for x in range(-31,32):
		for y in range(3):
			h.box(room,"Azulejo",Vector3(x*0.5,y*0.48+0.27,-13.85),Vector3(0.47,0.44,0.025),MARBLE)
			h.box(room,"MotivoAzul",Vector3(x*0.5,y*0.48+0.27,-13.82),Vector3(0.16,0.16,0.02),BLUE)
	# Balcão and open kitchen, with a generous passage between them.
	h.box(room,"BalcaoMadeira",Vector3(-9,0.65,-10),Vector3(12,1.3,1.4),WOOD)
	h.box(room,"BalcaoMarmore",Vector3(-9,1.36,-10),Vector3(12.3,0.16,1.65),MARBLE)
	h.box(room,"MaquinaCafe",Vector3(-12,1.85,-10),Vector3(1.6,0.8,0.7),Color("a6b4b2"))
	h.box(room,"FrenteMaquina",Vector3(-12,1.85,-9.63),Vector3(1.4,0.5,0.035),Color("34474a"))
	for x in [-12.4,-11.8]:
		h.round_shape(room,"GrupoCafe",Vector3(x,1.66,-9.5),0.09,0.15,Color("a6b4b2"))
		h.box(room,"ManivelaCafe",Vector3(x,1.66,-9.4),Vector3(0.08,0.08,0.28),WOOD)
	for x in [-14.0,-13.5,-10.5,-10.0]:
		h.round_shape(room,"GarrafaBalcao",Vector3(x,1.68,-10.2),0.09,0.48,Color("425d47"),0.05)
	for x in [-12.4,-11.8]:
		h.round_shape(room,"Chavena",Vector3(x,1.49,-9.6),0.1,0.16,MARBLE)
	h.box(room,"CaixaRegistadora",Vector3(-7,1.64,-10),Vector3(0.8,0.48,0.6),Color("536c62"))
	h.box(room,"Taloes",Vector3(-6,1.47,-9.7),Vector3(0.3,0.08,0.6),MARBLE)
	h.box(room,"QuadroPratos",Vector3(-4,2.5,-12.5),Vector3(3.4,1.8,0.15),WOOD)
	h.box(room,"Ardosia",Vector3(-4,2.5,-12.4),Vector3(3.1,1.55,0.04),Color("294b43"))
	var menu := Label3D.new()
	menu.text = "PRATOS DO DIA\nBacalhau · Pataniscas\nSopa · Petiscos"
	menu.font_size = 48
	menu.pixel_size = 0.003
	menu.outline_size = 0
	menu.modulate = Color("f3edd5")
	room.add_child(menu)
	menu.position = Vector3(-4,2.5,-12.36)
	h.box(room,"BancadaCozinha",Vector3(7.5,0.57,-10),Vector3(12,1.14,1.6),Color("d7d5c7"))
	for x in [3.0,6.0,9.0,12.0]:
		h.round_shape(room,"Panela",Vector3(x,1.42,-10),0.36,0.43,Color("62716d"))
		h.round_shape(room,"Tampa",Vector3(x,1.65,-10),0.39,0.07,Color("abb5a9"))
		h.ball(room,Vector3(x,1.74,-10),Vector3(0.13,0.12,0.13),WOOD)
	for x in [-10.0,-4.5,1.0]:
		for z in [-2.8,3.0]:
			table(h,room,Vector3(x,0,z))
			for side in [-1.0,1.0]:
				var stool := Vector3(x+side*0.7,0,z+1.3)
				h.box(room,"AssentoBanco",stool+Vector3(0,0.57,0),Vector3(0.6,0.12,0.5),WOOD)
				for dx in [-0.2,0.2]:
					for dz in [-0.16,0.16]:
						h.box(room,"PernaBanco",stool+Vector3(dx,0.26,dz),Vector3(0.09,0.52,0.09),WOOD)
	# Garrafeira and radio: tools have distinct accessible destinations.
	for z in [-3.0,0.0,3.0,6.0]:
		h.box(room,"FundoEstante",Vector3(14.6,1.25,z),Vector3(0.14,2.5,2.1),WOOD)
		for side in [-1.0,1.0]:
			h.box(room,"LadoEstante",Vector3(14,1.25,z+side),Vector3(1.3,2.5,0.12),WOOD)
		for y in [0.45,1.15,1.85,2.5]:
			h.box(room,"Prateleira",Vector3(14,y,z),Vector3(1.3,0.12,2.1),WOOD)
		for y in [0.7,1.4,2.1]:
			for offset in [-0.6,0,0.6]:
				h.round_shape(room,"Garrafa",Vector3(13.25,y,z+offset),0.11,0.45,Color("42634d"),0.055)
	h.box(room,"Radio",Vector3(10,1.25,-5.8),Vector3(1.3,0.6,0.5),WOOD)
	for x in [9.6,10.4]:
		h.ball(room,Vector3(x,1.26,-5.5),Vector3(0.25,0.25,0.04),Color("b5a07c"))
	h.box(room,"MesaRadio",Vector3(10,0.48,-5.8),Vector3(1.5,0.96,0.7),WOOD)
	for x in [-9.0,-3.0,3.0,9.0]:
		table(h,room,Vector3(x,0,11.5))
	for x in [-13.0,13.0]:
		h.box(room,"ServicoPatio",Vector3(x,0.5,9),Vector3(1.6,1,1),MARBLE)
		h.round_shape(room,"Bacia",Vector3(x,1.1,9),0.35,0.18,BLUE)
	for x in [-15.0,15.0]:
		for z in [8.0,14.0]:
			h.round_shape(room,"Vaso",Vector3(x,0.35,z),0.45,0.7,Color("ac654a"),0.6)
			h.ball(room,Vector3(x,1,z),Vector3(1.1,1.2,1.1),Color("668052"))
	for x in [-10.0,0.0,10.0]:
		h.round_shape(room,"Candeeiro",Vector3(x,4,-2),0.65,0.4,Color("d7ad68"),0.25)
	for key in CENTRES:
		var centre: Vector3 = CENTRES[key]
		h.plan_rooms.append({"id":key,"bounds":Rect2(Vector2(centre.x-4,centre.z-3),Vector2(8,6))})
	h.set_plan_walls(false)
