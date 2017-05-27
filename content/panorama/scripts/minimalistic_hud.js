'use strict';
var ONCLICK_PURGABLE_MODIFIERS = [
	'modifier_rubick_personality_steal',
	'modifier_tether_ally_aghanims'
];
var CustomChatLinesPanel,
	BossDropVoteTimers = [],
	HookedAbilityPanelsCount = 0;

function UpdatePanoramaHUD() {
	var unit = Players.GetLocalPlayerPortraitUnit();
	var unitName = GetHeroName(unit);
	FindDotaHudElement('UnitNameLabel').text = $.Localize(unitName).toUpperCase();
	if (unitName === 'npc_arena_rune') GameUI.SelectUnit(Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()), false);
	var CustomModifiersList = $('#CustomModifiersList');
	var VisibleModifiers = [];
	for (var i = 0; i < Entities.GetNumBuffs(unit); ++i) {
		var buffSerial = Entities.GetBuff(unit, i);
		if (buffSerial !== -1) {
			var buffName = Buffs.GetName(unit, buffSerial);
			VisibleModifiers.push(buffName);
			if (ONCLICK_PURGABLE_MODIFIERS.indexOf(buffName) !== -1) {
				if (CustomModifiersList.FindChildTraverse(buffName) == null) {
					var panel = $.CreatePanel('DOTAAbilityImage', CustomModifiersList, buffName);
					panel.abilityname = Buffs.GetTexture(unit, buffSerial);
					panel.SetPanelEvent('onactivate', (function(_buffName) {
						return function() {
							GameEvents.SendCustomGameEventToServer('modifier_clicked_purge', {
								unit: unit,
								modifier: _buffName
							});
						};
					})(buffName));
					panel.SetPanelEvent('onmouseover', (function(_panel, _buffName) {
						return function() {
							$.DispatchEvent('DOTAShowTitleTextTooltip', _panel, $.Localize('DOTA_Tooltip_' + _buffName), $.Localize('hud_modifier_click_to_remove'));
						};
					})(panel, buffName));
					panel.SetPanelEvent('onmouseout', (function(_panel) {
						return function() {
							$.DispatchEvent('DOTAHideTitleTextTooltip', _panel);
						};
					})(panel));
				}
			}
		}
	}

	_.each(CustomModifiersList.Children(), function(child) {
		if (VisibleModifiers.indexOf(child.id) === -1) child.DeleteAsync(0);
	});

	FindDotaHudElement('level_stats_frame').visible = Entities.GetAbilityPoints(unit) > 0 && Entities.IsControllableByPlayer(unit, Game.GetLocalPlayerID());

	var GoldLabel = FindDotaHudElement('ShopButton').FindChildTraverse('GoldLabel');
	if (Players.GetTeam(Game.GetLocalPlayerID()) === Entities.GetTeamNumber(unit)) {
		GoldLabel.text = FormatGold(GetPlayerGold(Entities.GetHeroPlayerOwner(unit)));
	} else {
		GoldLabel.text = '';
	}
	var sw = Game.GetScreenWidth();
	var sh = Game.GetScreenHeight();
	var minimap = FindDotaHudElement('minimap_block');
	$('#DynamicMinimapRoot').style.height = ((minimap.actuallayoutheight + 16) / sh * 100) + '%';
	$('#DynamicMinimapRoot').style.width = ((minimap.actuallayoutwidth + 16) / sw * 100) + '%';
	var glyphpos = FindDotaHudElement('glyph').GetPositionWithinWindow();
	if (glyphpos != null && !isNaN(glyphpos.x) && !isNaN(glyphpos.y))
		$('#SwitchDynamicMinimapButton').style.position = (glyphpos.x / sw * 100) + '% ' + (glyphpos.y / sh * 100) + '% 0';
	var pcs = FindDotaHudElement('PortraitContainer').GetPositionWithinWindow();
	if (pcs != null && !isNaN(pcs.x) && !isNaN(pcs.y))
		CustomModifiersList.style.position = (pcs.x / sw * 100) + '% ' + (pcs.y / sh * 100) + '% 0';
	var abilities = FindDotaHudElement('abilities');
	if (HookedAbilityPanelsCount !== abilities.GetChildCount()) {
		HookedAbilityPanelsCount = abilities.GetChildCount();
		_.each(abilities.Children(), function(child, index) {
			var btn = child.FindChildTraverse('AbilityButton');
			btn.SetPanelEvent('onactivate', function() {
				if (GameUI.IsAltDown()) {
					var unit = Players.GetLocalPlayerPortraitUnit();
					GameEvents.SendCustomGameEventToServer('custom_chat_send_message', {
						ability: Entities.GetAbility(unit, index)
					});
				}
			});
		});
	}

	var context = $.GetContextPanel();
	var activeBossDropVotingsCount = $('#BossDropItemVotingsListContainer').GetChildCount() - 1;
	var inactiveBossDropVotingsCount = $('#boss_item_vote_id_-1_container').GetChildCount();
	$('#BossDropActiveItemVotingsCounter').text = activeBossDropVotingsCount;
	$('#BossDropInactiveItemVotingsCounter').text = inactiveBossDropVotingsCount;
	context.SetHasClass('hideActiveBossItemVotings', activeBossDropVotingsCount === 0);
	context.SetHasClass('hideInactiveBossItemVotings', inactiveBossDropVotingsCount === 0);
}

function SetDynamicMinimapVisible(status) {
	$('#DynamicMinimapRoot').visible = status || !$('#DynamicMinimapRoot').visible;
}

function AutoUpdatePanoramaHUD() {
	$.Schedule(0.2, AutoUpdatePanoramaHUD);
	UpdatePanoramaHUD();
}

function HookPanoramaPanels() {
	FindDotaHudElement('QuickBuyRows').visible = false;
	FindDotaHudElement('shop').visible = false;
	FindDotaHudElement('RadarButton').visible = false;
	FindDotaHudElement('HUDSkinMinimap').visible = false;
	FindDotaHudElement('combat_events').visible = false;
	FindDotaHudElement('ChatEmoticonButton').visible = false;
	FindDotaHudElement('StatBranchDrawer').visible = false;
	FindDotaHudElement('CourierHasteButton').visible = false;
	FindDotaHudElement('CourierUpgradeButton').visible = false;
	FindDotaHudElement('topbar').visible = false;
	FindDotaHudElement('DeliverItemsButton').style.horizontalAlign = 'right';
	FindDotaHudElement('LevelLabel').style.width = '100%';
	FindDotaHudElement('stash').style.marginBottom = '47px';

	var shopbtn = FindDotaHudElement('ShopButton');
	var StatBranch = FindDotaHudElement('StatBranch');
	var level_stats_frame = FindDotaHudElement('level_stats_frame');
	var chat = FindDotaHudElement('ChatLinesWrapper');
	var StatsLevelUpTab = level_stats_frame.FindChildTraverse('LevelUpTab');

	shopbtn.FindChildTraverse('BuybackHeader').visible = false;
	shopbtn.ClearPanelEvent('onactivate');
	shopbtn.ClearPanelEvent('onmouseover');
	shopbtn.ClearPanelEvent('onmouseout');
	shopbtn.SetPanelEvent('onactivate', function() {
		if (GameUI.IsAltDown()) {
			GameEvents.SendCustomGameEventToServer('custom_chat_send_message', {
				GoldUnit: Players.GetLocalPlayerPortraitUnit()
			});
		} else {
			GameEvents.SendEventClientSide('panorama_shop_open_close', {});
		}
	});

	StatBranch.ClearPanelEvent('onactivate');
	StatBranch.ClearPanelEvent('onmouseover');
	StatBranch.ClearPanelEvent('onmouseout');
	StatBranch.hittestchildren = false;

	level_stats_frame.ClearPanelEvent('onmouseover');
	StatsLevelUpTab.ClearPanelEvent('onmouseover');
	StatsLevelUpTab.ClearPanelEvent('onmouseout');
	StatsLevelUpTab.ClearPanelEvent('onactivate');
	StatsLevelUpTab.SetPanelEvent('onactivate', function() {
		GameEvents.SendEventClientSide('custom_talents_toggle_tree', {});
	});
	var DebugChat = false;
	chat.FindChildTraverse('ChatLinesPanel').visible = DebugChat;
	if (chat.FindChildTraverse('SelectionChatMessages'))
		chat.FindChildTraverse('SelectionChatMessages').DeleteAsync(0);
	CustomChatLinesPanel = $.CreatePanel('Panel', chat, 'SelectionChatMessages');
	CustomChatLinesPanel.visible = !DebugChat;
	CustomChatLinesPanel.hittest = false;
	CustomChatLinesPanel.hittestchildren = false;
	AddStyle(CustomChatLinesPanel, {
		'width': '100%',
		'flow-children': 'down',
		'vertical-align': 'top',
		'overflow': 'squish noclip',
		'padding-right': '14px',
		'background-color': 'gradient( linear, 0% 0%, 100% 0%, from( #0000 ), color-stop( 0.01, #0000 ), color-stop( 0.1, #0000 ), to( #0000 ) )',
		'transition-property': 'background-color',
		'transition-duration': '0.23s',
		'transition-timing-function': 'ease-in-out'
	});

	var stats_region = FindDotaHudElement('stats_tooltip_region');
	stats_region.SetPanelEvent('onmouseover', function() {
		$.DispatchEvent('DOTAHUDShowDamageArmorTooltip', stats_region);
		var _unit = Players.GetLocalPlayerPortraitUnit();
		var custom_entity_value = GameUI.CustomUIConfig().custom_entity_values[_unit];
		var DOTAHUDDamageArmorTooltip = FindDotaHudElement('DOTAHUDDamageArmorTooltip');
		if (DOTAHUDDamageArmorTooltip != null && custom_entity_value != null) {
			if (custom_entity_value.AttributeStrengthGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable('strength_per_level', custom_entity_value.AttributeStrengthGain.toFixed(1));
			if (custom_entity_value.AttributeAgilityGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable('agility_per_level', custom_entity_value.AttributeAgilityGain.toFixed(1));
			if (custom_entity_value.AttributeIntelligenceGain != null)
				DOTAHUDDamageArmorTooltip.SetDialogVariable('intelligence_per_level', custom_entity_value.AttributeIntelligenceGain.toFixed(1));
			/*if (custom_entity_value.AttackRangeModify != null) {
				var modify = Math.round(custom_entity_value.AttackRangeModify);
				DOTAHUDDamageArmorTooltip.SetDialogVariable("bonus_attack_range", newChange);
			}*/
		}
	});
	stats_region.SetPanelEvent('onmouseout', function() {
		$.DispatchEvent('DOTAHUDHideDamageArmorTooltip');
	});
	var InventoryContainer = FindDotaHudElement('InventoryContainer');
	_.each(InventoryContainer.FindChildrenWithClassTraverse('InventoryItem'), function(child, index) {
		child.FindChildTraverse('AbilityButton').SetPanelEvent('onactivate', function() {
			var item = Entities.GetItemInSlot(Players.GetLocalPlayerPortraitUnit(), index);
			if (item > -1) {
				if (GameUI.IsAltDown()) {
					GameEvents.SendCustomGameEventToServer('custom_chat_send_message', {
						ability: item
					});
				} else {
					GameEvents.SendEventClientSide('panorama_shop_show_item_if_open', {
						'itemName': Abilities.GetAbilityName(item)
					});
					var _unit = Players.GetLocalPlayerPortraitUnit();
					if (Entities.IsControllableByPlayer(_unit, Game.GetLocalPlayerID())) {
						Abilities.ExecuteAbility(item, _unit, false);
					}
				}
			}
		});
	});
	var xpRoot = FindDotaHudElement('xp');
	_.each([xpRoot.FindChildTraverse('LevelBackground'), xpRoot.FindChildTraverse('CircularXPProgress'), xpRoot.FindChildTraverse('XPProgress')], function(p) {
		p.SetPanelEvent('onactivate', function() {
			if (GameUI.IsAltDown()) {
				GameEvents.SendCustomGameEventToServer('custom_chat_send_message', {
					xpunit: Players.GetLocalPlayerPortraitUnit()
				});
			}
		});
	});
}


// Toasts
function CreateCustomToast(data) {
	var row = $.CreatePanel('Panel', $('#CustomToastManager'), '');
	row.BLoadLayoutSnippet('ToastPanel');
	row.AddClass('ToastPanel');
	var rowText = '';

	if (data.type === 'kill') {
		var byNeutrals = data.killerPlayer == null;
		var isSelfKill = data.victimPlayer === data.killerPlayer;
		var isAllyKill = !byNeutrals && data.victimPlayer != null && Players.GetTeam(data.victimPlayer) === Players.GetTeam(data.killerPlayer);
		var isVictim = data.victimPlayer === Game.GetLocalPlayerID();
		var isKiller = data.killerPlayer === Game.GetLocalPlayerID();
		var teamVictim = byNeutrals || Players.GetTeam(data.victimPlayer) === Players.GetTeam(Game.GetLocalPlayerID());
		var teamKiller = !byNeutrals && Players.GetTeam(data.killerPlayer) === Players.GetTeam(Game.GetLocalPlayerID());
		row.SetHasClass('AllyEvent', teamKiller);
		row.SetHasClass('EnemyEvent', byNeutrals || !teamKiller);
		row.SetHasClass('LocalPlayerInvolved', isVictim || isKiller);
		row.SetHasClass('LocalPlayerKiller', isKiller);
		row.SetHasClass('LocalPlayerVictim', isVictim);
		if (isKiller)
			Game.EmitSound('notification.self.kill');
		else if (isVictim)
			Game.EmitSound('notification.self.death');
		else if (teamKiller)
			Game.EmitSound('notification.teammate.kill');
		else if (teamVictim)
			Game.EmitSound('notification.teammate.death');
		if (isSelfKill) {
			Game.EmitSound('notification.self.kill');
			rowText = $.Localize('custom_toast_PlayerDeniedSelf');
		} else if (isAllyKill) {
			rowText = $.Localize('#custom_toast_PlayerDenied');
		} else {
			if (byNeutrals) {
				rowText = $.Localize('#npc_dota_neutral_creep');
			} else {
				rowText = '{killer_name}';
			}
			rowText = rowText + ' {killed_icon} {victim_name} {gold}';
		}
	} else if (data.type === 'generic') {
		if (data.teamPlayer != null || data.teamColor != null) {
			var team = data.teamPlayer == null ? data.teamColor : Players.GetTeam(data.teamPlayer);
			var teamVictim = team === Players.GetTeam(Game.GetLocalPlayerID());
			if (data.teamInverted === 1)
				teamVictim = !teamVictim;
			row.SetHasClass('AllyEvent', teamVictim);
			row.SetHasClass('EnemyEvent', !teamVictim);
		} else
			row.AddClass('AllyEvent');
		rowText = $.Localize(data.text);
	}

	rowText = rowText.replace('{denied_icon}', "<img class='DeniedIcon'/>").replace('{killed_icon}', "<img class='CombatEventKillIcon'/>").replace('{time_dota}', "<font color='lime'>" + secondsToMS(Game.GetDOTATime(false, false), true) + '</font>');
	if (data.player != null)
		rowText = rowText.replace('{player_name}', CreateHeroElements(data.player));
	if (data.victimPlayer != null)
		rowText = rowText.replace('{victim_name}', CreateHeroElements(data.victimPlayer));
	if (data.killerPlayer != null)
		rowText = rowText.replace('{killer_name}', CreateHeroElements(data.killerPlayer));
	if (data.victimUnitName != null)
		rowText = rowText.replace('{victim_name}', "<font color='red'>" + $.Localize(data.victimUnitName) + '</font>');
	if (data.team != null)
		rowText = rowText.replace('{team_name}', "<font color='" + GameUI.CustomUIConfig().team_colors[data.team] + "'>" + GameUI.CustomUIConfig().team_names[data.team] + '</font>');
	if (data.gold != null)
		rowText = rowText.replace('{gold}', "<font color='gold'>" + FormatGold(data.gold) + "</font> <img class='CombatEventGoldIcon' />");
	if (data.runeType != null)
		rowText = rowText.replace('{rune_name}', "<font color='#" + RUNES_COLOR_MAP[data.runeType] + "'>" + $.Localize('custom_runes_rune_' + data.runeType + '_title') + '</font>');
	if (data.variables != null)
		for (var k in data.variables) {
			rowText = rowText.replace(k, data.variables[k]);
		}
	if (rowText.indexOf('<img') === -1)
		row.AddClass('SimpleText');
	row.FindChildTraverse('ToastLabel').text = rowText;
	$.Schedule(10, function() {
		row.AddClass('Collapsed');
	});
	row.DeleteAsync(10.3);
};

function CreateHeroElements(id) {
	var playerColor = GetHEXPlayerColor(id);
	return "<img src='" + TransformTextureToPath(GetPlayerHeroName(id), 'icon') + "' class='CombatEventHeroIcon'/> <font color='" + playerColor + "'>" + Players.GetPlayerName(id).encodeHTML() + '</font>';
}

// Boss Drop
function SetBossDropItemVotingsVisible() {
	$.GetContextPanel().ToggleClass('ShowBossDrop');
}

function CreateBossItemVote(id, data) {
	var row = $.CreatePanel('Panel', $('#BossDropItemVotingsListContainer'), 'boss_item_vote_id_' + id);
	row.BLoadLayoutSnippet('BossDropItemVote');
	var BossTakeLootTime = row.FindChildTraverse('BossTakeLootTime');
	BossTakeLootTime.max = data.time;
	(function Update() {
		var diff = Game.GetGameTime() - data.killtime;
		if (diff <= data.time) {
			BossTakeLootTime.value = BossTakeLootTime.max - diff;
			$.Schedule(0.1, Update);
		}
	})();

	var BossDropHideShowInfo = row.FindChildTraverse('BossDropHideShowInfo');
	row.FindChildTraverse('KilledBossName').text = $.Localize(data.boss);
	row.FindChildTraverse('KilledBossImage').SetImage(TransformTextureToPath(data.boss));
	var localPlayerScore = data.damagePcts[Game.GetLocalPlayerID()] || 0;
	//localPlayerScore = 50;
	var BossPlayerScore = row.FindChildTraverse('BossPlayerScore');
	BossPlayerScore.text = localPlayerScore.toFixed();

	var r = localPlayerScore<50 ? 255 : Math.floor(255-(localPlayerScore*2-100)*255/100), g = localPlayerScore>50 ? 255 : Math.floor((localPlayerScore*2)*255/100);
	BossPlayerScore.style.color = 'rgb('+r+','+g+',0)';
	_.each(data.rollableEntries, function(entry, entryid) {
		SnippetBossDropItemVoteItemPanel(row.FindChildTraverse('BossItemList'), id, entry, entryid);
	});
}

function SnippetBossDropItemVoteItemPanel(rootPanel, id, entry, entryid) {
	var itemRow = $.CreatePanel('Panel', rootPanel, 'boss_item_vote_id_' + id + '_item_' + entryid);
	itemRow.BLoadLayoutSnippet('BossDropItemVoteItemPanel');
	if (typeof entry === 'string') {
		itemRow.FindChildTraverse('BossDropItemIcon').itemname = entry;
		itemRow.AddClass('HasTakeButton');
		itemRow.FindChildTraverse('BossDropPlayersTake').SetPanelEvent('onactivate', function() {
			GameEvents.SendCustomGameEventToServer('bosses_vote_for_item', {
				voteid: id,
				entryid: entryid
			});
		});
	} else {
		itemRow.FindChildTraverse('BossDropItemIcon').itemname = entry.item;
		itemRow.FindChildTraverse('BossDropScoreCost').text = entry.weight;

		itemRow.SetPanelEvent('onactivate', function() {
			GameEvents.SendCustomGameEventToServer('bosses_vote_for_item', {
				voteid: id,
				entryid: entryid
			});
		});
	}
}

function UpdateBossItemVote(id, data) {
	if ($('#boss_item_vote_id_' + id) == null) CreateBossItemVote(id, data);
	var panel = $('#boss_item_vote_id_' + id);
	_.each(data.rollableEntries, function(entry, entryid) {
		var itempanel = panel.FindChildTraverse('boss_item_vote_id_' + id + '_item_' + entryid);
		if (entry.votes) {
			itempanel.FindChildTraverse('BossDropPlayersRow').RemoveAndDeleteChildren();
			//var localPlayerPickedTotalScore = 0;
			_.each(entry.votes, function(voteval, pid) {
				if (voteval === 1) {
					pid = Number(pid);
					var img = $.CreatePanel('Image', itempanel.FindChildTraverse('BossDropPlayersRow'), '');
					img.SetImage(TransformTextureToPath(GetPlayerHeroName(pid), 'icon'));
					img.SetPanelEvent('onmouseover', function() {
						$.DispatchEvent('DOTAShowTextTooltip', img, Players.GetPlayerName(pid));
					});
					img.SetPanelEvent('onmouseout', function() {
						$.DispatchEvent('DOTAHideTextTooltip');
					});
				}
			});
		}
	});
}

function CreateInactiveList() {
	var row = $.CreatePanel('Panel', $('#BossDropItemVotingsListContainer'), 'boss_item_vote_id_-1');
	var label = $.CreatePanel('Label', row, '');
	label.text = '#boss_loot_vote_inactive';
	$.CreatePanel('Panel', row, 'boss_item_vote_id_-1_container');
}

(function() {
	HookPanoramaPanels();
	$('#BossDropItemVotingsListContainer').RemoveAndDeleteChildren();
	CreateInactiveList();
	_DynamicMinimapSubscribe($('#DynamicMinimapRoot'));
	var mapInfo = Options.GetMapInfo();
	hud.AddClass('map_landscape_' + mapInfo.landscape);
	hud.AddClass('map_gamemode_' + mapInfo.gamemode);
	if ($.GetContextPanel().PTID_hero_bosses_loot_drop_votes) PlayerTables.UnsubscribeNetTableListener($.GetContextPanel().PTID_hero_bosses_loot_drop_votes);
	DynamicSubscribePTListener('bosses_loot_drop_votes', function(tableName, changesObject, deletionsObject) {
		for (var id in changesObject) {
			var splittedId = id.split('_');
			if (Number(splittedId[0]) === Players.GetTeam(Game.GetLocalPlayerID())) {
				if (splittedId[1] === '-1') {
					$('#boss_item_vote_id_-1_container').RemoveAndDeleteChildren();
					_.each(changesObject[id], function(entry, entryid) {
						if (!$('#boss_item_vote_id_' + id + '_item_' + entryid)) SnippetBossDropItemVoteItemPanel($('#boss_item_vote_id_-1_container'), id, entry, entryid);
					});
				} else {
					UpdateBossItemVote(id, changesObject[id]);
				}
			}
		}
		for (var id in deletionsObject) {
			if ($('#boss_item_vote_id_' + id) != null) {
				$('#boss_item_vote_id_' + id).DeleteAsync(0);
			}
		}
	}, function(ptid) {$.GetContextPanel().PTID_hero_bosses_loot_drop_votes = ptid;});

	AutoUpdatePanoramaHUD();
	GameEvents.Subscribe('create_custom_toast', CreateCustomToast);

	GameEvents.Subscribe('create_generic_panel', function(data) {
		var random = getRandomInt(0, 100000);
		var panel;
		switch(data.type) {
			case 'i':
				panel = $.CreatePanel('Image', $.GetContextPanel(), random);
				panel.SetImage(data.image);
				break;
			case 'v':
				$.GetContextPanel().BCreateChildren('<Movie id="' + random + '" src="' + data.source + '" controls="none" repeat="true" autoplay="onload" />');
				panel = $.GetContextPanel().FindChildTraverse(random);
				break;
			case 'h':
				$.GetContextPanel().BCreateChildren('<HTML id="' + random + '" url="' + data.source + '" />');
				panel = $.GetContextPanel().FindChildTraverse(random);
				panel.style.height = '600px';
				panel.style.width = '800px';
				panel.SetPanelEvent('onactivate', function() {});
				break;
		}
		panel.style.align = 'center center';
		data.duration && panel.DeleteAsync(data.duration);
	});
})();
