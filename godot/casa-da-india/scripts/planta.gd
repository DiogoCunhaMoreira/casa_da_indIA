@tool
extends RefCounted
## Planta composta pelas mesmas seis salas que se abrem individualmente.
const ROOMS = [
	["Gabinete do Feitor", "gabinete", Vector3(-10.5,0,-11)],
	["Escrivães", "escrivaes", Vector3(10.5,0,-11)],
	["Conselho", "conselho", Vector3(-10.5,0,0)],
	["Cartografia", "cartografia", Vector3(10.5,0,0)],
	["Tesouraria", "tesouraria", Vector3(-10.5,0,11)],
	["Refeitório e Adega", "refeitorio", Vector3(10.5,0,11)],
]
const BUILDERS = [preload("res://scripts/gabinete.gd"),preload("res://scripts/escrivaes.gd"),preload("res://scripts/conselho.gd"),preload("res://scripts/cartografia.gd"),preload("res://scripts/tesouraria.gd"),preload("res://scripts/refeitorio.gd")]

func build(h: Node3D, world: Node3D) -> void:
	var site = h.pivot(world,"CasaCompleta",Vector3.ZERO)
	h.box(site,"FundacaoComum",Vector3(0,-0.55,0),Vector3(38,0.45,33.7),Color("aa9c84"))
	h.box(site,"Corredor",Vector3(0,0.02,0),Vector3(4.5,0.08,33.2),Color("d6c5a6"))
	h.room_rug(site,Vector3.ZERO,Vector3(2.0,0.025,32.1),Color("944f49"))
	h.plan_walls_cut = h.pivot(site,"ParedesEmCorte",Vector3.ZERO)
	h.plan_walls_full = h.pivot(site,"ParedesCompletas",Vector3.ZERO)
	for index in range(ROOMS.size()):
		var data = ROOMS[index]
		var anchor = h.pivot(site,data[0],data[2])
		BUILDERS[index].new().build(h,anchor)
		var room = anchor.get_child(0)
		# Conserva as paredes que suportam mapas e arquivos; abre a face do corredor.
		for child in room.get_children():
			var title := String(child.name)
			if not child is Node3D:
				continue
			if title.begins_with("Corte"):
				child.visible = false
			if index%2 == 1 and child.position.x < -7.4:
				# Retira também portadas e frisos presos à parede removida.
				child.visible = false
		var side := -1.0 if index%2 == 0 else 1.0
		var inner_x := -side*8.14
		var cut = h.pivot(h.plan_walls_cut,"Divisao",data[2])
		var full = h.pivot(h.plan_walls_full,"Divisao",data[2])
		# Versão A: conserva o corte baixo para comparação direta.
		h.box(cut,"LimiteExterior",Vector3(side*8.14,0.37,0),Vector3(0.22,0.74,10.3),h.CREAM)
		for limits in [Vector2(-5.15,1.6),Vector2(3.8,5.15)]:
			h.box(cut,"DivisoriaCorredor",Vector3(inner_x,0.36,(limits.x+limits.y)/2),Vector3(0.22,0.72,limits.y-limits.x),h.CREAM)
		for z in [1.6,3.8]:
			h.box(cut,"Ombreira",Vector3(inner_x,0.62,z),Vector3(0.3,1.24,0.15),h.WOOD)
		# Versão B: parede de 4,7 m, vão de 3,2 m e porta aberta para dentro.
		if side > 0:
			h.box(full,"ParedeExterior",Vector3(side*8.14,2.35,0),Vector3(0.22,4.7,10.3),h.CREAM)
		for limits in [Vector2(-5.15,1.6),Vector2(3.8,5.15)]:
			h.box(full,"DivisoriaCorredor",Vector3(inner_x,2.35,(limits.x+limits.y)/2),Vector3(0.24,4.7,limits.y-limits.x),h.CREAM)
		h.box(full,"ParedeSobrePorta",Vector3(inner_x,3.95,2.7),Vector3(0.24,1.5,2.2),h.CREAM)
		h.box(full,"Coroamento",Vector3(inner_x,4.67,0),Vector3(0.34,0.12,10.3),h.WOOD)
		for z in [1.6,3.8]:
			h.box(full,"OmbreiraCompleta",Vector3(inner_x,1.62,z),Vector3(0.38,3.24,0.16),h.WOOD)
		h.box(full,"Verga",Vector3(inner_x,3.22,2.7),Vector3(0.38,0.18,2.36),h.WOOD)
		var door = h.pivot(full,"PortaAberta",Vector3(inner_x,0,1.7))
		door.rotation.y = side*PI/2
		h.box(door,"Folha",Vector3(0,1.54,0.97),Vector3(0.10,3.02,1.94),h.WOOD)
		for z in [0.22,0.65,1.08,1.51,1.88]:
			h.box(door,"Tabua",Vector3(0.058,1.54,z),Vector3(0.025,2.92,0.025),h.GOLD.darkened(0.25))
		for y in [0.48,2.55]:
			h.box(door,"Ferragem",Vector3(0.075,y,0.97),Vector3(0.035,0.095,1.87),h.INK)
		h.ball(door,Vector3(0.14,1.4,1.72),Vector3(0.13,0.12,0.12),h.GOLD)
		h.box(anchor,"Soleira",Vector3(inner_x,0.065,2.7),Vector3(0.70,0.05,2.2),h.CREAM)
		h.plan_rooms.append({"id":data[1],"bounds":Rect2(Vector2(data[2].x-8.25,data[2].z-5.25),Vector2(16.5,10.5))})
	# Patamar e cais prolongam o eixo principal da Casa.
	h.box(site,"Patio",Vector3(0,-0.10,17.8),Vector3(38,0.25,2.8),Color("c6b99d"))
	for side in [-1.0,1.0]:
		h.box(site,"PilarEntrada",Vector3(side*1.7,1.05,16.55),Vector3(0.5,2.1,0.55),h.CREAM)
		h.box(site,"BandeiraEntrada",Vector3(side*1.7,1.2,16.87),Vector3(0.33,0.9,0.035),Color("994a43"))
	h.box(site,"Tejo",Vector3(0,-0.44,21.6),Vector3(38,0.18,4.8),Color("599d9f"))
	for i in range(17):
		h.box(site,"TabuaPontao",Vector3(0,-0.02,19+i*0.28),Vector3(3.1,0.15,0.26),h.WOOD.lightened(float(i%3)*0.025))
	for side in [-1.0,1.0]:
		for z in [19.2,21.3,23.3]:
			h.round_shape(site,"Estaca",Vector3(side*1.4,-0.1,z),0.13,0.95,h.WOOD)
	for i in range(5):
		h.barrel(site,Vector3(-6.5+i*0.9,0,17.8))

	h.set_plan_walls(not "--walls-cut" in OS.get_cmdline_user_args())
