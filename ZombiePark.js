/*****************************************************************************
 * Copyright (c) 2020-2021 Sadret
 *
 * The OpenRCT2 plug-in "Soft Guest Cap Calculator" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

/// <reference path="./../../openrct2.d.ts" />



var increaseHunger = function() {
	if (scenario.name === "Zombie Park") {
		for (var i = 0; i < map.numEntities; i++) {
			var entity = map.getEntity(i);
			if (entity && entity.type === 'peep' && entity.hunger > 2) {
				entity.hunger -= 2;
			}
		}
	}
}

registerPlugin({
	name: "zombie park hunger script",
	version: "1.0",
	authors: ["TwinCrows"],
	type: "local",
	licence: "GPL-3.0",
	minApiVersion: 29,
	main: function() {
		context.subscribe(
			"interval.day",
			function() {
				increaseHunger();
			}
		);
		
	},
});