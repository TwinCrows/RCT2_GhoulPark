
function setGuestAttributes(info) {
	var guest = map.getEntity(info.id);
	
	//guest.minIntensity = 1;
	//if (guest.minIntensity < 4) guest.minIntensity = 4;
	//if (guest.maxIntensity < 7) guest.maxIntensity = 7;
	guest.maxIntensity += 1;
	if (guest.nauseaTolerance < 2) guest.nauseaTolerance = 2; // ghouls have a medium or high nausea tolerance
}

var monthLastReport = 0;
var reportGhoulAttacks = 0;
var reportSecurityGhoulTerms = 0;

function parkCasualtyRestore() {
	if (park.casualtyPenalty > 3) park.casualtyPenalty-=3;
}

var summaryGhoulAttacks = function() {
	if (monthLastReport != date.month){
		var str = ("There were ");
		str = str.concat(reportGhoulAttacks);
		if (reportGhoulAttacks <= 10) str = str.concat(" ghoul attacks last month.");
		if (reportGhoulAttacks > 10) str = str.concat(" ghoul attacks last month. Consider reducing crowding, shortening queues, improving security routes, and adding food shops. ");
		var msg = {type: "chart", text: str};
		park.postMessage(msg);
		reportGhoulAttacks = 0;
		
		var str = ("Our security guards terminated ");
		str = str.concat(reportSecurityGhoulTerms);
		if (reportSecurityGhoulTerms < 20) str = str.concat(" ghouls last month.");
		if (reportSecurityGhoulTerms >= 20) str = str.concat(" ghouls last month! Ker-blam!");
		var msg = {type: "chart", text: str};
		park.postMessage(msg);
		reportSecurityGhoulTerms = 0;
		
		var str = ("There are currently ");
		var allGuests = map.getAllEntities("guest");
		var numAngryGhouls = 0;
		for (var i = 0; i < allGuests.length; i++) {
			if (allGuests[i].getFlag("angry")) numAngryGhouls+=1;
		}
		var str = str.concat(numAngryGhouls);
		if (numAngryGhouls < 10) str = str.concat(" raging ghouls in the park.");
		if (numAngryGhouls >= 10) str = str.concat(" raging ghouls in the park! Consider placing security in queues!");
		var msg = {type: "chart", text: str};
		park.postMessage(msg);
		reportSecurityGhoulTerms = 0;
	}
	
	monthLastReport = date.month;
}


var dailyDecayHungerHappiness = function() {
	
	/*
	map.getAllEntities("guest").forEach(function(guest)
	{
		guest.tshirtColour = 56;
	})
	*/
	
	
	if (scenario.name.includes("Ghoul")) {
		var allGuests = map.getAllEntities("guest");
		
		for (var i = 0; i < allGuests.length; i++) {
			var entity = allGuests[i];
			
			
			//entity.hunger = 255;
			//console.log(entity.hunger);
			//entity.nauseaTarget = 0; // ghouls never get nauseous
			
			
			/// HUNGER ///
			if (entity.hunger > 5) { // ghouls are hungrier than normal guests (low = hungry!)
				entity.hunger -= 4; // hunger drops every day. a full hunger bar is removed every 2 months
			};
			if (entity.hunger < 30) { // when hungry, happiness and energy rapidly drains (low = hungry!)
				if (entity.thirst > 10) entity.thirst -= 8;
				if (entity.happiness > 20) entity.happiness -= 12;
			};
			if (entity.thirst < 30) { // when hungry, happiness and energy rapidly drains (low = hungry!)
				if (entity.happiness > 20) entity.happiness -= 12;
			};
			if (entity.thirst < 30 && entity.hunger < 30) { // if hungry and thirsty, ghouls get nauseous
				if (entity.nauseaTarget < 230){
					entity.nauseaTarget += 60;
					entity.nausea += 60;
				}
			};
			if (entity.nausea > 150) { // if nauseous, get even more unhappy (rapidly changing to enraged)
				if (entity.happiness > 25) entity.happiness -= 25;
			};
			if (entity.hunger > 150) { // if ghouls have full bellies, they tend to be happy (hunger high = full! happiness high = happy!)
				if (entity.happinessTarget < 200) entity.happinessTarget = 200;
			};
			
			/// RAGE ///
			if (entity.happiness < 20 && entity.hunger < 20 && entity.thirst < 20) { // when a guest is both unhappy, hungry, and thirsty, they rage and must be manually removed (high = happy!)
				entity.setFlag("angry", true);
				entity.nauseaTarget = 0;
				entity.nausea = 0;
			};
			if (entity.energy < 50){ // zombies can't rage if they are tired
				entity.setFlag("angry", false);
			}
			/*
			if (entity.getFlag("angry") && (entity.happiness > 30 || entity.hunger > 30 || entity.thirst > 30)) { // when an angry ghoul recovers over 30 HAPPINESS HUNGER or THIRST they end berserk stage
				entity.setFlag("angry", false);
				entity.setFlag("happiness", true);
			};
			*/
			if (entity.getFlag("angry")) { // angry guests have special attributes
				//if (entity.energy < 200) entity.energy += 25; // angry ghouls have energy (high energy = energetic!)
				//entity.happiness = 0;
				//entity.hunger = 0;
				//entity.thirst = 0;
				//entity.energy = 255;
				//entity.toilet = 0; // high value makes them clutch groin
			};
			//if (entity.hunger < 50) entity.setFlag("angry", true);
		}
	}
}


function angryAlert() {
	if (scenario.name.includes("Ghoul")) {
		var allGuests = map.getAllEntities("peep");
		for (var i = 0; i < allGuests.length; i++) {
			var entity = map.getEntity(i);
			if (entity && entity.type === 'peep' && entity.getFlag("angry") && entity.isInPark) {
				
				var name = entity.name;
				var entityId = entity.id;
				var str = name.concat(" has become a raging ghoul!")
				var msg = {type: "peep", text: str, subject: entityId};
				park.postMessage(msg);

			}
		}
	}
	return;
}

function securityPacifyGhouls() {
	if (scenario.name.includes("Ghoul") && date.ticksElapsed % 80 === 0) {
		var allStaff = map.getAllEntities("staff");
		
		
		
		for (var y = 0; y < allStaff.length; y++){
			
			if (allStaff[y].staffType == "security") {
				
				// search through -6 to -6 to +6 to +6 tiles (144 tiles total) for ranged defense (non-crowded)
				for (var xMod = -6; xMod <= 6; xMod++){
					for (var yMod = -6; yMod <= 6; yMod++){
						
						var entityCoords = {x: allStaff[y].x + xMod, y: allStaff[y].y + yMod};
						var guestsHere = map.getAllEntitiesOnTile("guest", entityCoords);
						
						for (var j = 0; j < guestsHere.length; j++){
							if (guestsHere[j].getFlag("angry") && guestsHere[j].energy > 100 && !guestsHere[j].getFlag("crowded")){ // check for any angry ghouls, that are not crowded
								
								var name = allStaff[y].name;
								var securityId = allStaff[y].id;
								var str = name.concat(" has terminated the raging ")
								var str = str.concat(guestsHere[j].name)
								var msg = {type: "peep", text: str, subject: securityId};
								//park.postMessage(msg);
								
								reportSecurityGhoulTerms+=1; // monthly summary
								
								//park.casualtyPenalty += 2; //security kills happen frequent and shouldn't harm player much
								
								/* nonlethal
								//guestsHere[j].energy = 20;
								//guestsHere[j].hunger = 200;
								//guestsHere[j].happiness = 150;
								*/
								
								guestsHere[j].setFlag("angry", false);
								guestsHere[j].energy = 20;
								guestsHere[j].setFlag("explode", true) // safe & delayed method with SFX
								
							}
						}
					}
				}
				
				var entityCoords = {x: allStaff[y].x, y: allStaff[y].y};
				var guestsHere = map.getAllEntitiesOnTile("guest", entityCoords);
				
				for (var j = 0; j < guestsHere.length; j++){
				
					if (guestsHere[j].getFlag("angry") && guestsHere[j].energy > 100 && guestsHere[j].getFlag("crowded")){ // check for any angry ghouls, that are crowded
									
						var name = allStaff[y].name;
						var securityId = allStaff[y].id;
						var str = name.concat(" has ended the raging ")
						var str = str.concat(guestsHere[j].name)
						var str = str.concat(" at close range.")
						var msg = {type: "peep", text: str, subject: securityId};
						//park.postMessage(msg);
						
						
						/* nonlethal
						//guestsHere[j].energy = 50;
						//guestsHere[j].hunger = 200;
						//guestsHere[j].happiness = 150;
						*/
						
						guestsHere[j].setFlag("angry", false);
						guestsHere[j].energy = 20;
						guestsHere[j].setFlag("explode", true) // safe & delayed method with SFX
						
					}
				}
				
			}
		}
	}
}



function angryExplodeOthers() {
	
	
	
	if (scenario.name.includes("Ghoul") && date.ticksElapsed % 40 === 0) {
		var allGuests = map.getAllEntities("guest");
		
		for (var i = 0; i < allGuests.length; i++) {
			var entity = map.getEntity(i);
			if (entity && entity.type === 'peep' && entity.getFlag("angry") && entity.energy > 70) { // must be angry AND have energy to infect
				
				//entity.setFlag("nausea", true);
				
				var entityCoords = {x: entity.x, y: entity.y};
				var guestsHere = map.getAllEntitiesOnTile("guest", entityCoords);
				
				var denyRemove = true;
				
				
				
				// deny only if guest is on any ride
				/*
				var denyRemove = false;
				var allCars = map.getAllEntities("car");
				for (var k = 0; k < allCars.length; k++){
					for (var l = 0; l < allCars[k].guests.length; l++){
						if (allCars[k].guests[l]==guestsHere[j]) {
							denyRemove = true;
						}
					}
				}
				*/
				
				// accept only if guest is on a tile with footpath
				//can't access tiles during ticks
				/*
				var tile = map.getTile(entity.x, entity.y);
				for (var x = 0; x < tile.numElements; x++){
					var element = tile.getElement(x);
					if (element.type === "footpath"){
						
						denyRemove=false;
					}
				}
				*/
				
				for (var j = 0; j < guestsHere.length; j++){
					if (guestsHere[j].name!=entity.name && guestsHere[j].energy > 70 && Math.random()*2500 < 1){ // chance to proceed with attack
						
						
						
						var name = guestsHere[j].name;
						var guestId = guestsHere[j].id;
						
						var str = name.concat(" has been attacked by a ghoul!")
						var msg = {type: "peep", text: str};
						//park.postMessage(msg); // reported as monthly summary instead
						park.casualtyPenalty += 5;
						
						// ghoul attacks leave victims exhausted and sick
						guestsHere[j].nausea = 255;
						guestsHere[j].energy = 0;
						
						// increase ghoul attacks report number
						reportGhoulAttacks += 1;
						
						// chance to kill
						if (Math.random()*100 < 80){ 
							guestsHere[j].setFlag("explode", true); // safe & delayed method with SFX
							park.casualtyPenalty += 10;
						}
						/* // recovery makes it so finding ghouls is not necessary. should be essential
						if (entity.hunger < 175) entity.hunger += 75;
						if (entity.happiness < 175) entity.happiness += 75;
						if (entity.thirst < 175) entity.thirst += 75;
						*/
						
						 // create litter
						var newLitter = map.createEntity("litter", guestsHere[j]);
						newLitter.litterType = "vomit";
						
						
						
						//if (denyRemove===false) { // if safe to remove, remove
							
							
							//map.createEntity("explosion_cloud", entity);
							//map.createEntity("explosion_flare", entity);
							
							
							//entity.setFlag("litter", true); // doesnt seem to work
							//guestsHere[j].remove(); // kill them! method bugs out
							
							
							
							//guestsHere[j].setFlag("explode", true); // old, slow, delayed method with SFX
							
						//}
					}
				}
			}
		}
	}
	return;
}

var main = function()
{
	monthLastReport = date.month;
	
	context.subscribe("interval.day", dailyDecayHungerHappiness);
	context.subscribe("interval.day", summaryGhoulAttacks);
	context.subscribe("interval.day", parkCasualtyRestore);
	context.subscribe("guest.generation", setGuestAttributes);
	
	
	
	context.subscribe(
		"interval.tick",
		function() {
			securityPacifyGhouls();
			angryExplodeOthers();
		}
	);
	
	
	//context.setInterval(function() {angryExplodeOthers()}, 4000); //more efficient
	//context.setInterval(function() {securityExplodeGhouls()}, 300); //more efficient
	//context.setInterval(function() {angryAlert()}, 30000); //more efficient //disabled to make deaths more mysterious
}

registerPlugin({
	name: "Ghoul Park Hunger & Aggression",
	version: "1.0",
	authors: ["TwinCrows"],
	type: "local",
	licence: "MIT",
	minApiVersion: 29,
	main: main
});