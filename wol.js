var request = require('request');
var fs      = require('fs');

/**
	WastedOnLol Client
	Usage: wol.js summonername (region)
	by Nightf0rc3
**/
if (process.argv[2]) {
	getKey(function(key) {
		if(!key) {
			console.log("No Key Found! Grabbing key...");
			grabNewKey(function(key) {
				if (key) {
					getInfo(key);
				}
			});
		} else {
			getInfo(key);
		}
	})
} else {
	console.log('Usage: wol.js summonername (region)');
}

function grabNewKey(callback) {
	request('https://wol.gg/', function(error, response, body) {
		var regexString = 'jwt=(.*)"';
		var match = body.match(new RegExp(regexString));
		if (match) {
			fs.writeFile(".WoL-Key", match[1], function(err) {
				callback(match[1]);
			});
		} else {
			console.log('Can\'t grab Key!');
			process.exit(1);
			callback(false);
		}
	});
}

function getKey(callback) {
	fs.readFile(".WoL-Key", function(err, key) {
		if (err) {
			callback(false);
		} else {
			callback(key);
		}
	});
}

function getInfo(key) {
	var region = (process.argv[3]) ? process.argv[3] : 'euw';
	var req = {
		url: 'https://wol.gg/api/stats/' + region + '/' + process.argv[2] + '/0',
		headers: {'Authorization': 'Bearer ' + key}
	}
	//console.log('requesting information...');
	request(req, function(error, response, body){
		if (!error) {
			var content = JSON.parse(body);
			if (content.summoner) {
				console.log('summoner: ' + content.summoner.summoner_name);
				console.log('league:   ' + content.summoner.summoner_rank);
				console.log('winrate:  ' + content.summoner_stats_ranked_global.ranked_global_winrate);
				console.log('wasted:   ' + content.summoner_stats_wasted.stats_wasted_hours + 'h');
				console.log('kda:      ' + content.summoner_stats_ranked_global.ranked_global_kda);
			} else {
				if (content.status && content.message) {
					logger.error('Token expired! Try again');
					fs.unlinkSync('.WoL-Key');
				} else if (content.error && content.code == 404) {
					logger.error('Summoner ' + process.argv[2] + ' not found!');
				} else {
					console.log('Unknown error:');
					console.log(content);
				}
			}
		} else {
			logger.error('Something went wrong!');
			console.log(error);
		}
	});
}