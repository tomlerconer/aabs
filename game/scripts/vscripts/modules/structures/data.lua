COURIER_HEALTH_BASE = 200
COURIER_HEALTH_GROWTH = 200

HEALER_HEALTH_BASE = 10
HEALER_HEALTH_GROWTH = 5

TEAM_HEALER_MODELS = {
	[DOTA_TEAM_GOODGUYS] = {
		mdl = "models/props_structures/radiant_statue001.vmdl",
		active = "particles/world_shrine/radiant_shrine_active.vpcf",
		ambient = "particles/world_shrine/radiant_shrine_ambient.vpcf"
	},
	[DOTA_TEAM_BADGUYS] = {
		mdl = "models/props_structures/dire_statue002.vmdl",
		active = "particles/world_shrine/dire_shrine_active.vpcf",
		ambient = "particles/world_shrine/dire_shrine_ambient.vpcf"
	},
}

ShopsData = {
	Secret = {
		"item_casino_drug_pill1",
		"item_casino_drug_pill2",
		"item_casino_drug_pill3",
		"item_casino_coin",
	},
	Duel = {
		{ item = "item_dust", cost = 900 },
		{ item = "item_ward_sentry", cost = 1800 },
		{ item = "item_tango_arena", cost = 550 },
	}
}
