var uniqid = require('uniqid');
const Helper = require('../../helper/helper.js');

module.exports = function (app, db) {

	app.post('/initgame/', (req, res) => {

		const response_json = { status: '', msg: '' }

		db.collection('card').findOne({}, { _id: 0 }, (err, result) => {

			const prepare_card = [];
			const playercards = [];

			if (err) {

				console.log('Card find Err :: ', err);
				response_json.status = 0;
				response_json.msg = 'failed';

			} else {

				if (req.body.gametype === '1') {

					prepare_card.push(result.card);
				} else {

					for (let i = 0; i < req.body.gametype; i++) {

						prepare_card.push(result.card);
					}

					let merged = [].concat.apply([], prepare_card);

					preparePlayerCards(Helper.shuffle(merged));

					function preparePlayerCards(arr) {

						for (let i = 0; i < (req.body.playercount + 1); i++) {

							playercards.push(arr.pop());
						}

						response_json['card'] = playercards;
						response_json.status = 1;
						response_json.msg = 'success';

						//insert into sufflecards table 
						//GameID
						//RoundID
						//LevelID

						prepareSuffleCards = { "gameid": uniqid(), cards: arr }
						db.collection('sufflecards').insert(prepareSuffleCards, (err, result) => {
							if (err) {
								console.log('save suffle card :: ', err);
								response_json.status = 0;
								response_json.msg = 'failed';
							}
						});
					}
				}
			}

			res.send(response_json);
		})

	});


	app.post('/drawcards/', (req, res) => {

		const response_json = { status: 1, msg: 'success' }
		db.collection('sufflecards').findOne({ gameid: req.body.gameid }, (err, result) => {

			if (err) {

				console.log('Card find Err :: ', err);
				response_json.status = 0;
				response_json.msg = 'failed';

			} else {
				callShuffle(result.cards);
			}

			async function callShuffle(car_arr) {

				let hold_arr = await Helper.shuffle(car_arr);
				response_json['card'] = hold_arr.pop();
				

				db.collection('sufflecards').update({_id: result._id},{$set: {cards: hold_arr} }, { upsert: true }, (err, result) => {

					if (err) {
						response_json.status = 0;
						response_json.msg = 'An error has occurred while updating';

					} else {

						res.send(response_json);
					}

				});
				
			}
		})
	});

};