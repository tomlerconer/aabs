modifier_arena_rune_acceleration = class({})

function modifier_arena_rune_acceleration:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT
	}
end

function modifier_arena_rune_acceleration:GetModifierAttackSpeedBonus_Constant()
	return 90
end

function modifier_arena_rune_acceleration:IsPurgable()
	return false
end

function modifier_arena_rune_acceleration:GetTexture()
	return "arena_rune_acceleration"
end

function modifier_arena_rune_acceleration:GetEffectName()
	return "particles/arena/generic_gameplay/rune_acceleration.vpcf"
end

function modifier_arena_rune_acceleration:GetEffectAttachType()
	return PATTACH_ABSORIGIN_FOLLOW
end

if IsServer() then
	function modifier_arena_rune_acceleration:OnCreated(keys)
		self.creep_xp_multiplier = keys.creep_xp_multiplier
	end
end