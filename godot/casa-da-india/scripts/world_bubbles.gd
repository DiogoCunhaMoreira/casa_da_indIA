extends CanvasLayer
## Legible thought clouds projected above the 3D characters, with overlap avoidance.
var cards: Dictionary = {}

func add_actor(id: String) -> void:
	var panel := PanelContainer.new()
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = Color("fff7e5")
	style.border_color = Color("9b8768")
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 6
	style.content_margin_bottom = 7
	panel.add_theme_stylebox_override("panel",style)
	var text := Label.new()
	text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text.add_theme_font_size_override("font_size",13)
	text.add_theme_color_override("font_color",Color("332e29"))
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.custom_minimum_size.x = 158
	panel.add_child(text)
	add_child(panel)
	var dots: Array = []
	for radius in [6,3]:
		var dot := Panel.new()
		dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var skin := StyleBoxFlat.new()
		skin.bg_color = style.bg_color
		skin.set_corner_radius_all(radius)
		dot.add_theme_stylebox_override("panel",skin)
		dot.size = Vector2.ONE*radius*2
		add_child(dot)
		dots.append(dot)
	cards[id] = {"panel":panel,"text":text,"dots":dots}

func remove_actor(id: String) -> void:
	if not cards.has(id): return
	cards[id].panel.queue_free()
	for dot in cards[id].dots: dot.queue_free()
	cards.erase(id)

func update_bubbles(agents: Dictionary, camera: Camera3D, life: RefCounted) -> void:
	var viewport := camera.get_viewport().get_visible_rect().size
	var occupied: Array[Rect2] = [Rect2(8,8,340,70)]
	var ordered: Array = agents.values()
	ordered.sort_custom(func(a,b): return priority(a)>priority(b))
	for a in ordered:
		if not cards.has(a.live_id): continue
		var card: Dictionary = cards[a.live_id]
		var panel: PanelContainer = card.panel
		panel.visible = false
		for dot in card.dots: dot.visible = false
		var head: Vector3 = a.node.global_position+Vector3(0,2.05,0)
		if camera.is_position_behind(head): continue
		var anchor := camera.unproject_position(head)
		if not Rect2(Vector2.ZERO,viewport).has_point(anchor): continue
		var words: String = life.activity(a)
		if words.is_empty(): continue
		var prefix: String = (a.social_kind if a.social_time>0 else "Pausa") if a.state in life.FREE and (a.social_time>0 or a.break_stage!="") else a.caption
		# Work text is actual hook/parser output; social text is visibly marked as a pause.
		var content: String = a.name.left(30)+" · "+prefix+"\n"+words.replace("\n"," ").left(115)
		if card.text.text != content:
			card.text.text = content
			panel.reset_size()
		var size := panel.get_combined_minimum_size()
		size.x = maxf(178,size.x)
		panel.size = size
		var position := Vector2(clampf(anchor.x-size.x/2,8,maxf(8,viewport.x-size.x-8)),anchor.y-size.y-17)
		var placed := false
		for attempt in range(7):
			var rect := Rect2(position,size).grow(4)
			var collision := false
			for other in occupied:
				if rect.intersects(other):
					collision = true
					break
			if not collision and position.y>=8:
				occupied.append(rect)
				placed = true
				break
			position.y -= size.y+8
		if not placed: continue
		panel.position = position
		panel.visible = true
		for i in range(2):
			var dot: Panel = card.dots[i]
			dot.position = Vector2(clampf(anchor.x-10+i*6,position.x+8,position.x+size.x-15),position.y+size.y+2+i*9)
			dot.visible = true

func priority(a: Dictionary) -> int:
	return (100 if a.ring.visible else 0)+(50 if a.state=="blocked" else 0)+(20 if a.live_working else 0)
