extends RefCounted
## Six connected interiors, retaining one live world and all 21 agent seats.
const ID = "tasca"
const OVERVIEW = "tasca"
const OVERVIEW_FOCUS = Vector3(0,0.5,1)
const OVERVIEW_SIZE = 44.0
const CENTRES = {"balcao":Vector3(-9.5,0,-10.5),"cozinha":Vector3(9.5,0,-10.5),"mesas":Vector3(-9.5,0,0),"reservado":Vector3(9.5,0,0),"despensa":Vector3(-9.5,0,10.5),"patio":Vector3(9.5,0,10.5)}
const NAMES = {"balcao":"Balcão e gerência","cozinha":"Cozinha","mesas":"Sala de mesas","reservado":"Sala reservada","despensa":"Adega e despensa","patio":"Pátio dos habituais"}
const SEATS = [0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]
const WOOD = Color("58392c")
const TRIM = Color("95663e")
const CREAM = Color("e8dfc8")
const BLUE = Color("234a85")
const PLASTER = Color("d9d0b8")
var h: Node3D
var decor: RefCounted

func seat_position(seat: Variant) -> Vector3:
	if seat == null: return waiting_position(0)
	var n := SEATS.find(int(seat))
	if n == 0: return CENTRES.balcao+Vector3(0,0,0.5)
	if n <= 6: return CENTRES.mesas+Vector3(-3.8+((n-1)/2)*3.8,0,-0.7+(-1.4 if n%2==1 else 1.4))
	if n <= 12: return CENTRES.reservado+Vector3(-3+((n-7)/2)*3,0,-0.3+(-1.5 if n%2==1 else 1.5))
	if n <= 16: return CENTRES.cozinha+Vector3(-4.5+(n-13)*3,0,-1.7)
	return CENTRES.despensa+Vector3(-4+(n-17)*2.65,0,0.4)

func station_position(station: String, home: Vector3) -> Vector3:
	match station:
		"board": return CENTRES.balcao+Vector3(5.5,0,-2.8)
		"mailbox": return CENTRES.balcao+Vector3(3.5,0,0.5)
		"web", "mcp": return CENTRES.reservado+Vector3(4.9,0,-2.8)
		"shelf": return CENTRES.despensa+Vector3(4.8,0,-2.9)
	return home

func blocked_position(index: int) -> Vector3:
	return Vector3(-1.2+float(index%3)*1.2,0,-13+float(index/3)*1.2)

func waiting_position(index: int) -> Vector3:
	return Vector3(-12+float(index%12)*2,0,17.5)

func break_position(stage: String, place: int = 0) -> Vector3:
	if stage == "serve": return CENTRES.patio+Vector3(-4.8,0,-2.7)
	if stage == "wash": return CENTRES.patio+Vector3(4.8,0,-2.7)
	return CENTRES.patio+Vector3(-3 if place<2 else 3,0,-1.4 if place%2==0 else 1.4)

func box(p: Node3D, title: String, at: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	return h.box(p,title,at,size,color)

func build(host: Node3D, world: Node3D) -> void:
	h = host
	decor = preload("res://scripts/tasca_decor.gd").new(h)
	var site = h.pivot(world,"CasaCompleta",Vector3.ZERO)
	var passage = h.pivot(site,"CorredorDaTasca",Vector3.ZERO)
	box(passage,"Fundacao",Vector3(0,-0.28,1.3),Vector3(34,0.5,35.5),Color("aa9677"))
	box(passage,"Corredor",Vector3(0,0,0),Vector3(5.4,0.06,31.5),Color("cebea1"))
	for z in range(44):
		for x in [-1.0,0.0,1.0]:
			var tile = box(passage,"LosangoCorredor",Vector3(x*1.3,0.04,-15+z*0.7),Vector3(0.22,0.015,0.22),BLUE)
			tile.rotation.y = PI/4
	box(passage,"EntradaCalcada",Vector3(0,0.025,17),Vector3(33,0.05,3),Color("bfbba9"))
	for x in [-2.45,2.45]:
		box(passage,"ColunaEntrada",Vector3(x,1.7,15.7),Vector3(0.34,3.4,0.4),CREAM)
		decor.tile_panel(passage,Vector3(x,1,15.92),Vector2(0.34,1.5))
	var sign = decor.frame(passage,Vector3(0,3.5,15.8),Vector2(4.9,0.8),BLUE)
	decor.lettering(sign,"TASCA PORTUGUESA",Vector3(0,0,0.13),0.005)
	h.plan_walls_cut = h.pivot(site,"ParedesEmCorte",Vector3.ZERO)
	h.plan_walls_full = h.pivot(site,"ParedesCompletas",Vector3.ZERO)
	for key in CENTRES:
		var centre: Vector3 = CENTRES[key]
		var room = h.pivot(site,NAMES[key],centre)
		architecture(room,key)
		match key:
			"balcao": counter(room)
			"cozinha": kitchen(room)
			"mesas": dining(room)
			"reservado": private_room(room)
			"despensa": cellar(room)
			"patio": courtyard(room)
		h.plan_rooms.append({"id":key,"bounds":Rect2(Vector2(centre.x-6.8,centre.z-4.9),Vector2(13.6,9.8))})
	h.set_plan_walls(false)

func architecture(room: Node3D, key: String) -> void:
	var right := room.position.x > 0
	for x in range(17):
		for z in range(12):
			var color := Color("ad8063").lightened(float((x*3+z*7)%5)*0.018)
			if key=="cozinha": color = Color("c9c8b5") if (x+z)%2==0 else Color("637b83")
			if key=="patio": color = Color("d0cbb8") if (x+int(sin(z*0.65)*2))%5!=0 else Color("60645c")
			box(room,"Ladrilho",Vector3(-6.4+x*0.8,0.025,-4.4+z*0.8),Vector3(0.78,0.06,0.78),color)
	# Retain the decorated rear wall when the foreground walls are cut away.
	box(room,"ParedeDecorada",Vector3(0,1.9,-4.9),Vector3(13.6,3.8,0.22),PLASTER)
	decor.tile_panel(room,Vector3(0,1.02,-4.77),Vector2(13.4,1.65))
	for y in [0.13,1.89]: box(room,"FrisoAzul",Vector3(0,y,-4.72),Vector3(13.45,0.09,0.10),BLUE)
	box(room,"Sanca",Vector3(0,3.72,-4.72),Vector3(13.5,0.15,0.3),WOOD)
	for x in [-6.5,6.5]: box(room,"Pilarete",Vector3(x,1.9,-4.67),Vector3(0.17,3.8,0.21),CREAM)
	var inner := -6.8 if right else 6.8
	var outer := -inner
	# The left exterior remains tall, like a dollhouse; other front walls toggle.
	if not right:
		var side = h.pivot(room,"ParedeExterior",Vector3(outer,0,0))
		side.rotation.y = PI/2
		box(side,"Reboco",Vector3(0,1.9,0),Vector3(9.8,3.8,0.22),PLASTER)
		decor.tile_panel(side,Vector3(0,1.02,0.13),Vector2(9.6,1.65))
		box(side,"Remate",Vector3(0,1.9,0.16),Vector3(9.7,0.08,0.1),BLUE)
		decor.window(side,Vector3(-1.6,2.73,0.16))
		if key=="balcao": decor.photograph(side,Vector3(2,2.8,0.17),2)
		elif key=="mesas": decor.saying(side,"CASA ONDE NÃO HÁ PÃO,\nTODOS RALHAM\nE NINGUÉM TEM RAZÃO",Vector3(2.4,2.8,0.17),Vector2(2.65,1.35),0.004)
		else: decor.saying(side,"VINHO DA CASA\nCOLHEITA DO ANO",Vector3(2,2.8,0.17),Vector2(2.5,1.1),0.0045)
	for walls in [h.plan_walls_cut,h.plan_walls_full]:
		var group = h.pivot(walls,"Divisorias",room.position)
		var height := 0.7 if walls==h.plan_walls_cut else 3.8
		box(group,"ParedeFrente",Vector3(0,height/2,4.9),Vector3(13.6,height,0.22),PLASTER)
		if right: box(group,"ParedeExterior",Vector3(outer,height/2,0),Vector3(0.22,height,9.8),PLASTER)
		for interval in [Vector2(-4.9,1.45),Vector2(3.95,4.9)]:
			box(group,"DivisoriaComPorta",Vector3(inner,height/2,(interval.x+interval.y)/2),Vector3(0.22,height,interval.y-interval.x),PLASTER)
		box(group,"RodapeFrente",Vector3(0,0.18,4.76),Vector3(13.35,0.22,0.09),BLUE)
	for z in [1.4,4.0]: box(room,"OmbreiraPorta",Vector3(inner,1.55,z),Vector3(0.36,3.1,0.18),WOOD)
	box(room,"VergaPorta",Vector3(inner,3.05,2.7),Vector3(0.36,0.2,2.8),WOOD)
	box(room,"Soleira",Vector3(inner,0.035,2.7),Vector3(0.65,0.07,2.5),CREAM)
	# Small ceramic room plaque, readable in room view without dominating the overview.
	var plaque = decor.frame(room,Vector3(0,3.3,-4.72),Vector2(3.7,0.52),CREAM)
	decor.lettering(plaque,NAMES[key],Vector3(0,0,0.13),0.0038,BLUE)
	for x in [-5.8,5.8]: decor.lamp(room,Vector3(x,2.85,-4.5))

func counter(room: Node3D) -> void:
	decor.shelving(room,Vector3(-3.4,0,-4.2),4.6)
	decor.steel_box(room,"BalcaoInox",Vector3(0,0.65,-1.4),Vector3(9.5,1.3,1.4))
	decor.steel_box(room,"TampoInox",Vector3(0,1.36,-1.4),Vector3(9.8,0.16,1.6))
	decor.steel_rail(room,Vector3(0,1.37,-0.61),9.8,0.075)
	decor.steel_box(room,"EspelhoInox",Vector3(0,1.51,-2.16),Vector3(9.8,0.22,0.075))
	box(room,"RodapeBalcao",Vector3(0,0.13,-0.675),Vector3(9.46,0.20,0.035),Color("454f53"))
	for x in [-3.8,-1.9,0.0,1.9,3.8]:
		decor.steel_box(room,"PainelInoxEscovado",Vector3(x,0.72,-0.681),Vector3(1.86,0.94,0.055))
		for y in [0.32,1.12]:
			for dx in [-0.82,0.82]:
				h.ball(room,Vector3(x+dx,y,-0.641),Vector3(0.025,0.025,0.008),Color("626b70"))
	decor.steel_rail(room,Vector3(0,0.24,-0.35),9.4,0.055)
	for x in [-4.4,0.0,4.4]: decor.steel_box(room,"SuporteBarra",Vector3(x,0.24,-0.5),Vector3(0.055,0.055,0.3))
	for i in range(15):
		box(room,"RanhuraEscorredor",Vector3(-3.4+i*0.12,1.448,-1.0),Vector3(0.035,0.008,0.38),Color("616e74"))
	box(room,"MaquinaCafe",Vector3(-2.5,1.82,-1.4),Vector3(1.7,0.76,0.7),Color("9faea9"))
	box(room,"FrenteMaquina",Vector3(-2.5,1.82,-1.03),Vector3(1.5,0.5,0.04),BLUE)
	for x in [-2.9,-2.2]:
		h.round_shape(room,"Chavena",Vector3(x,1.52,-0.92),0.09,0.16,CREAM)
		box(room,"Manivela",Vector3(x,1.71,-0.9),Vector3(0.065,0.065,0.25),WOOD)
	box(room,"CaixaRegistadora",Vector3(2.5,1.65,-1.4),Vector3(0.9,0.5,0.7),Color("577365"))
	for x in range(5): box(room,"Tecla",Vector3(2.2+x*0.14,1.76,-1.02),Vector3(0.085,0.07,0.06),CREAM)
	box(room,"Taloes",Vector3(3.5,1.47,-1.2),Vector3(0.4,0.05,0.55),CREAM)
	for x in [-4.2,0.7,1.2]: decor.bottle(room,Vector3(x,1.45,-1.6),1)
	var board = decor.frame(room,Vector3(3.8,2.62,-4.68),Vector2(3.4,1.42),Color("253f37"))
	decor.lettering(board,"PRATOS DO DIA\nBacalhau à Brás · Pataniscas\nSopa de legumes · Moelas\nVinho da casa",Vector3(0,0,0.14),0.0035)
	for x in [-3.3,3.3]: decor.chair(room,Vector3(x,0,1.5),PI)
	decor.clock(room,Vector3(0,2.65,-4.68))
	decor.plant(room,Vector3(-5.6,0,3.4))

func dining(room: Node3D) -> void:
	for x in [-3.8,0.0,3.8]:
		decor.table(room,Vector3(x,0,-0.7),1.8,x!=0,int((x+3.8)/3.8))
		decor.chair(room,Vector3(x+0.1*sin(x),0,-3.1),sin(x+1)*0.12)
		decor.chair(room,Vector3(x,0,1.7),PI+cos(x)*0.13)
	decor.saying(room,"FIADO\nSÓ AMANHÃ",Vector3(-3.5,2.67,-4.65),Vector2(3.5,1.15),0.007)
	decor.saying(room,"QUEM NÃO É PARA COMER,\nNÃO É PARA TRABALHAR",Vector3(3.5,2.67,-4.65),Vector2(3.5,1.15),0.0048)
	decor.wall_plate(room,Vector3(-1.05,2.58,-4.64),0.32)
	decor.photograph(room,Vector3(0.65,2.58,-4.64),1)
	box(room,"Aparador",Vector3(-4.4,0.58,3.9),Vector3(3.5,1.16,0.75),WOOD)
	h.round_shape(room,"PilhaPratos",Vector3(-5.3,1.25,3.9),0.27,0.13,CREAM)
	box(room,"CestoPao",Vector3(-4.3,1.3,3.9),Vector3(0.75,0.28,0.5),TRIM)
	h.ball(room,Vector3(-4.3,1.47,3.9),Vector3(0.6,0.2,0.3),Color("b9975e"))
	box(room,"ToalhasDobradas",Vector3(-3.4,1.25,3.9),Vector3(0.55,0.17,0.5),CREAM)
	decor.plant(room,Vector3(3.8,0,3.8))

func private_room(room: Node3D) -> void:
	box(room,"Tapete",Vector3(0,0.07,-0.3),Vector3(10.4,0.025,6.3),Color("8b5047"))
	for z in [-3.25,2.65]: box(room,"BarraTapete",Vector3(0,0.09,z),Vector3(10.1,0.014,0.16),Color("c5a576"))
	decor.table(room,Vector3(0,0,-0.3),8.5,true,1)
	for x in [-3.0,0.0,3.0]:
		decor.chair(room,Vector3(x,0,-2.85),0)
		decor.chair(room,Vector3(x+0.1,0,2.25),PI+sin(x+2)*0.14)
	decor.saying(room,"PÃO E VINHO\nFAZEM CAMINHO",Vector3(-4.6,2.6,-4.65),Vector2(2.3,1.10),0.0045)
	decor.guitar(room,Vector3(-2.35,2.55,-4.57))
	decor.saying(room,"A BOA MESA\nJUNTA A GENTE",Vector3(0.65,2.6,-4.65),Vector2(3.05,1.1),0.0055)
	decor.wall_plate(room,Vector3(2.75,2.6,-4.65),0.33)
	box(room,"ConsolaRadio",Vector3(4.8,1.9,-4.35),Vector3(2.3,0.14,0.8),WOOD)
	box(room,"RadioAntigo",Vector3(4.8,2.28,-4.23),Vector3(1.7,0.68,0.5),TRIM)
	for x in [4.28,5.32]:
		var speaker = h.round_shape(room,"Altifalante",Vector3(x,2.28,-3.96),0.23,0.04,WOOD)
		speaker.rotation.x = PI/2
	box(room,"EscalaRadio",Vector3(4.8,2.3,-3.96),Vector3(0.35,0.16,0.035),CREAM)

func kitchen(room: Node3D) -> void:
	# A working range, washing station and preparation area, not repeated cabinets.
	decor.steel_box(room,"FogaoIndustrial",Vector3(-3.25,0.65,-3.7),Vector3(4.9,1.3,1.5))
	decor.steel_box(room,"MesaFogao",Vector3(-3.25,1.34,-3.7),Vector3(5.05,0.12,1.62))
	for x in [-4.8,-3.25,-1.7]:
		for z in [-4.08,-3.32]:
			var burner := Vector3(x,1.43,z)
			h.round_shape(room,"QueimadorFerro",burner,0.24,0.07,Color("252a2c"))
			h.torus(room,burner+Vector3(0,0.04,0),0.18,0.025,Color("566775"))
			for angle in [0.0,PI/2]:
				var grate = box(room,"GrelhaFogao",burner+Vector3(0,0.09,0),Vector3(0.66,0.065,0.055),Color("303638"))
				grate.rotation.y = angle
	for x in [-4.5,-2.0]:
		box(room,"PortaFornoEsmaltada",Vector3(x,0.64,-2.92),Vector3(2.15,0.86,0.08),Color("343e42"))
		box(room,"VidroForno",Vector3(x,0.59,-2.865),Vector3(1.68,0.46,0.025),Color("17252b"))
		for y in [0.46,0.63]: box(room,"GrelhaInteriorForno",Vector3(x,y,-2.845),Vector3(1.53,0.018,0.012),Color("687573"))
		decor.steel_rail(room,Vector3(x,0.99,-2.8),1.72,0.045)
	for i in range(6):
		var knob = h.round_shape(room,"ComandoGas",Vector3(-5.12+i*0.75,1.23,-2.85),0.095,0.08,Color("20282a"))
		knob.rotation.x = PI/2
		box(room,"MarcaComando",Vector3(-5.12+i*0.75,1.27,-2.801),Vector3(0.015,0.055,0.012),CREAM)
	decor.pot(room,Vector3(-4.8,1.56,-4.08),0.35,0.56,Color("a47148"),true)
	decor.pot(room,Vector3(-3.25,1.56,-3.32),0.29,0.28,Color("8c9c9f"),false)
	decor.frying_pan(room,Vector3(-1.7,1.56,-4.08))
	decor.steel_box(room,"Exaustor",Vector3(-3.25,2.95,-4.4),Vector3(5.2,0.4,0.7))
	decor.steel_box(room,"CondutaExaustor",Vector3(-3.25,3.45,-4.3),Vector3(1.3,0.6,0.55))
	for i in range(15): box(room,"FiltroExaustor",Vector3(-5.45+i*0.31,2.735,-4.35),Vector3(0.16,0.025,0.5),Color("4f5c5d"))
	box(room,"ArmarioPreparacao",Vector3(1.5,0.58,-3.7),Vector3(2.5,1.16,1.5),Color("66858c"))
	for y in [0.3,0.65,1.0]:
		box(room,"GavetaUtensilios",Vector3(1.5,y,-2.92),Vector3(2.3,0.28,0.06),CREAM)
		decor.steel_rail(room,Vector3(1.5,y,-2.84),0.6,0.025)
	decor.steel_box(room,"LavaLouca",Vector3(4.3,0.58,-3.7),Vector3(2.9,1.16,1.5))
	decor.steel_box(room,"BordoLavaLouca",Vector3(4.3,1.22,-3.7),Vector3(3.0,0.12,1.58))
	box(room,"CubaEscura",Vector3(4.1,1.287,-3.7),Vector3(1.5,0.015,0.95),Color("52676c"))
	box(room,"FundoCuba",Vector3(4.1,1.296,-3.7),Vector3(1.17,0.01,0.66),Color("85989a"))
	decor.steel_box(room,"Torneira",Vector3(4.1,1.62,-4.25),Vector3(0.075,0.7,0.075))
	decor.steel_box(room,"Bica",Vector3(4.1,1.95,-4.05),Vector3(0.075,0.075,0.47))
	decor.steel_rail(room,Vector3(2,2.6,-4.48),3.3,0.035)
	for i in range(3):
		var x := 0.7+i*0.87
		box(room,"CaboUtensilio",Vector3(x,2.27,-4.43),Vector3(0.065,0.5,0.05),WOOD)
		if i==0: h.ball(room,Vector3(x,1.97,-4.43),Vector3(0.22,0.3,0.08),TRIM)
		elif i==1: decor.steel_box(room,"Espatula",Vector3(x,1.98,-4.43),Vector3(0.23,0.27,0.035))
		else: h.ball(room,Vector3(x,1.98,-4.38),Vector3(0.25,0.22,0.17),Color("9aa8a9"))
	box(room,"IlhaPreparacao",Vector3(0,0.52,1.1),Vector3(4.5,1.04,1.4),WOOD)
	box(room,"PedraIlha",Vector3(0,1.1,1.1),Vector3(4.65,0.12,1.55),CREAM)
	var board = box(room,"TabuaCortar",Vector3(-1.15,1.18,1.14),Vector3(1.45,0.065,0.9),TRIM)
	board.rotation.y = 0.12
	for at in [Vector3(-1.5,1.28,1.1),Vector3(-1.05,1.26,1.3)]: h.ball(room,at,Vector3(0.24,0.2,0.23),Color("b95237"))
	decor.steel_box(room,"LaminaFaca",Vector3(-0.8,1.23,0.95),Vector3(0.45,0.025,0.12))
	box(room,"CaboFaca",Vector3(-0.46,1.23,0.95),Vector3(0.23,0.06,0.10),WOOD)
	decor.pot(room,Vector3(1.4,1.17,1.1),0.32,0.19,CREAM,false)
	h.ball(room,Vector3(0.4,1.3,1.35),Vector3(0.6,0.26,0.29),Color("b69558"))
	box(room,"PanoDobrado",Vector3(1.4,1.18,0.55),Vector3(0.7,0.05,0.35),Color("819aa1"))
	decor.plant(room,Vector3(5.5,0,3.7))

func cellar(room: Node3D) -> void:
	decor.shelving(room,Vector3(-3.4,0,-4.15),4.8)
	box(room,"ArmarioMercearia",Vector3(3.4,1.35,-4.3),Vector3(4.8,2.7,0.45),WOOD)
	for y in [0.4,1.25,2.1]:
		box(room,"PrateleiraMantimentos",Vector3(3.4,y,-4.0),Vector3(4.8,0.12,0.85),TRIM)
		for i in range(4):
			var x := 1.55+i*1.1
			if i==2 and y>2: continue
			if i%2==0: h.ball(room,Vector3(x,y+0.35,-4.0),Vector3(0.62,0.65,0.45),Color("bbab86"))
			else: box(room,"LataAzeite",Vector3(x,y+0.3,-4.0),Vector3(0.45,0.6,0.42),Color("71815a"))
	box(room,"MesaRegistos",Vector3(0,0.95,-1.15),Vector3(10.3,0.15,1.2),WOOD)
	for x in [-4.7,4.7]: box(room,"PeMesa",Vector3(x,0.46,-1.15),Vector3(0.17,0.92,0.8),TRIM)
	for x in [-4.0]:
		box(room,"LivroContas",Vector3(x,1.06,-1.15),Vector3(0.8,0.09,0.65),CREAM)
		box(room,"Lombada",Vector3(x,1.12,-1.15),Vector3(0.035,0.015,0.65),WOOD)
	box(room,"BalancaBase",Vector3(-1.35,1.13,-1.15),Vector3(0.7,0.18,0.6),Color("56736b"))
	h.round_shape(room,"PratoBalanca",Vector3(-1.35,1.4,-1.15),0.38,0.06,CREAM)
	decor.bottle(room,Vector3(1.3,1.03,-1.15),2)
	box(room,"EncomendaPapel",Vector3(3.95,1.17,-1.15),Vector3(0.95,0.3,0.65),Color("b9a17c"))
	h.barrel(room,Vector3(-5.1,0,3.5))
	var barrel = h.pivot(room,"BarricaPequena",Vector3(-3.65,0,3.7))
	barrel.scale = Vector3(0.72,0.8,0.72)
	h.barrel(barrel,Vector3.ZERO)
	for x in [1.0,2.6]:
		box(room,"CaixaMadeira",Vector3(x,0.38,3.8),Vector3(1.15,0.76,0.9),TRIM)
		for y in [0.15,0.38,0.62]: box(room,"RipaCaixa",Vector3(x,y,4.27),Vector3(1.13,0.13,0.06),WOOD)
	decor.wall_plate(room,Vector3(0,2.65,-4.65),0.4)

func courtyard(room: Node3D) -> void:
	for x in [-3.0,3.0]:
		decor.table(room,Vector3(x,0,0),1.8,x>0,2 if x<0 else 1)
		decor.chair(room,Vector3(x,0,-2.4),0)
		decor.chair(room,Vector3(x,0,2.4),PI)
	for x in [-4.8,4.8]:
		box(room,"ServicoPatio",Vector3(x,0.5,-4.0),Vector3(1.8,1,1.1),CREAM)
		if x>0:
			h.round_shape(room,"BaciaLouca",Vector3(x,1.1,-4),0.35,0.2,BLUE)
			decor.steel_box(room,"TorneiraPatio",Vector3(x,1.45,-4.4),Vector3(0.08,0.7,0.08))
			decor.steel_box(room,"BicaPatio",Vector3(x,1.77,-4.23),Vector3(0.08,0.08,0.42))
		else:
			decor.pot(room,Vector3(x,1.01,-4),0.32,0.42,Color("b68050"),true)
			h.round_shape(room,"CanecaPatio",Vector3(x+0.6,1.13,-3.8),0.12,0.24,CREAM)
	decor.window(room,Vector3(0,2.6,-4.7))
	decor.plant(room,Vector3(-5.7,0,-2.0))
	var herb = h.pivot(room,"ErvasAromaticas",Vector3(5.7,0,-1.8))
	herb.scale = Vector3(0.7,0.65,0.7)
	decor.plant(herb,Vector3.ZERO)
	decor.plant(room,Vector3(0,0,3.7))
	# Grapevine and timber suggest a shaded courtyard without hiding its agents.
	for x in [-5.8,5.8]: box(room,"PosteLatada",Vector3(x,1.8,-3.9),Vector3(0.14,3.6,0.14),WOOD)
	box(room,"VigaLatada",Vector3(0,3.6,-3.9),Vector3(11.8,0.15,0.18),WOOD)
	for i in range(13):
		var x := -5.4+i*0.9
		h.ball(room,Vector3(x,3.64+0.08*sin(i*1.7),-3.9+0.14*cos(i)),Vector3(0.8+0.2*sin(i*2),0.23,0.5+0.15*cos(i*3)),Color("566e3b"))
		if i%3==0: h.ball(room,Vector3(x,3.36,-3.9),Vector3(0.16,0.3,0.16),Color("615270"))
