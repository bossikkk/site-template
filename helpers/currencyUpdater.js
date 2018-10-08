const request = require('request-promise-native');
const asyncRedis = require('async-redis');
const config = require('../configs/config');
const client = asyncRedis.createClient(config.redis);

setInterval(async () => {
	let resultObj = {};
	try {
		let json = await request('https://www.cbr-xml-daily.ru/daily_json.js');
		let body = JSON.parse(json);
		resultObj.USD = body.Valute.USD.Value;
		resultObj.EUR = body.Valute.EUR.Value;
		resultObj.UAH = body.Valute.UAH.Value;
		resultObj.JPY = body.Valute.JPY.Value;

		json = await request('https://api.coinmarketcap.com/v2/ticker/?convert=RUB&limit=10');
		body = JSON.parse(json);
		resultObj.BTC = body.data['1'].quotes.RUB.price;
		resultObj.ETH = body.data['1027'].quotes.RUB.price;
		resultObj.XMR = body.data['328'].quotes.RUB.price;
		resultObj.ADA = body.data['2010'].quotes.RUB.price;

		await client.del('Currencies');
		await client.lpush('Currencies', JSON.stringify(resultObj));
	} catch (error) {
		console.log(error);
	}
}, 5000);

exports.update = server => {
	let io = require('socket.io')(server);

	io.on('connection', socket => {
		socket.on('request_curr', () => {
			client
				.lrange('Currencies', 0, 1)
				.then(json => {
					socket.emit('update', JSON.parse(json));
				})
				.catch(console.log);
		});
	});
};
