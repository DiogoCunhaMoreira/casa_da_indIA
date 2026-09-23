extends RefCounted
## Geometry-independent live-world destinations for the original Casa.
const ID = "casadaindia"
const OVERVIEW = "casa"
const OVERVIEW_FOCUS = Vector3(0,0.2,2.5)
const OVERVIEW_SIZE = 49.0
const CENTRES = {"gabinete": Vector3(-10.5,0,-11), "escrivaes": Vector3(10.5,0,-11), "conselho": Vector3(-10.5,0,0), "cartografia": Vector3(10.5,0,0), "tesouraria": Vector3(-10.5,0,11), "refeitorio": Vector3(10.5,0,11)}

func seat_position(seat: Variant) -> Vector3:
	if seat == null:
		return Vector3(1.2,0,17.4)
	var n := int(seat)
	if n == 0:
		return CENTRES.gabinete + Vector3(0,0,-2.6)
	if n <= 8:
		return CENTRES.escrivaes + Vector3(-5.4 + ((n-1)%4)*3.6,0,-0.8 if n <= 4 else 2.5)
	if n <= 11:
		return CENTRES.cartografia + [Vector3(-2.8,0,1.75),Vector3(4.75,0,-0.35),Vector3(0.4,0,1.75)][n-9]
	if n <= 15:
		return CENTRES.tesouraria + [Vector3(-2.6,0,1.25),Vector3(-0.7,0,1.25),Vector3(1.2,0,1.25),Vector3(5.35,0,1.55)][n-12]
	return CENTRES.conselho + Vector3(-4.25 if n < 19 else 4.25,0,-2.0+((n-16)%3)*2.0)

func station_position(station: String, home: Vector3) -> Vector3:
	match station:
		"board": return Vector3(0,0,8)
		"mailbox": return Vector3(1,0,6)
		"web", "mcp": return CENTRES.cartografia+Vector3(4.75,0,-0.35)
		"shelf":
			var centre: Vector3 = CENTRES.escrivaes
			for entry in CENTRES.values():
				if Vector2(entry.x-home.x,entry.z-home.z).length() < 9.0:
					centre = entry
					break
			return centre+Vector3(0,0,-3)
	return home

func blocked_position(index: int) -> Vector3:
	return Vector3(-1,0,14.5-float(index)*0.65)

func waiting_position(index: int) -> Vector3:
	return Vector3(3+float(index%12)*0.8,0,17.5)

func break_position(stage: String, place: int = 0) -> Vector3:
	if stage == "serve": return CENTRES.refeitorio+Vector3(-0.5,0,-2.55)
	if stage == "wash": return CENTRES.refeitorio+Vector3(6.5,0,-2.5)
	return CENTRES.refeitorio+[Vector3(-3.4,0,1.8),Vector3(-3.4,0,-0.78),Vector3(3.7,0,-0.30),Vector3(5.5,0,0.9)][place]
