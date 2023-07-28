const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
	

	res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with the specific origin you want to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.setHeader('Access-Control-Allow-Headers', '*');

	if(req.url == '/'){

		// return /frontend/index.html
		fs.readFile('./frontend/index.html', (err, data) => {
			if(err) throw err;

			// get random flag from flags folder
			fs.readdir('./flags', (err, files) => {
				if(err) throw err;
				let randomFlag = files[Math.floor(Math.random() * files.length)];
				// convert flag to base64
				fs.readFile('./flags/' + randomFlag, (err, data) => {
					if(err) throw err;
					let base64Flag = Buffer.from(data).toString('base64');
					// send response
					fs.readFile('./frontend/index.html', (err, data) => {
						if(err) throw err;
						res.writeHead(200, {'Content-Type': 'text/html'});
						data = data.toString().replace('//setSource(%%SOURCE_IMAGE%%, %%SOURCE_NAME%%);', 'setSource("data:image/png;base64,' + base64Flag + '", "'+randomFlag.split('.')[0]+'");');
						data = data.toString().replace('%%DEV_FLAG%%', randomFlag);

                        let flagList = JSON.parse(fs.readFileSync('./flaglist.json'));
                        let flagListString = '';
                        for(let i = 0; i < flagList.length; i++){
                            flagListString += `<div class="item" data-value="${flagList[i].name}"><img src="data:image/png;base64,${flagList[i].img}" loading="lazy"> ${flagList[i].name}</div>`;
                        }

                        data = data.toString().replace('%%DROPDOWN_CONTENT%%', flagListString);


						res.write(data);
						res.end();
					});
				});
			});
		});
	}

	if(req.url.startsWith('/assets')){
		// serve assets from /frontend/assets
		fs.readFile('./frontend' + req.url, (err, data) => {
			if(err) throw err;

			if(req.url.endsWith('.js')) res.writeHead(200, {'Content-Type': 'text/javascript'});
			if(req.url.endsWith('.css')) res.writeHead(200, {'Content-Type': 'text/css'});
			if(req.url.endsWith('.png')) res.writeHead(200, {'Content-Type': 'image/png'});
			if(req.url.endsWith('.jpg')) res.writeHead(200, {'Content-Type': 'image/jpg'});
			if(req.url.endsWith('.gif')) res.writeHead(200, {'Content-Type': 'image/gif'});
			if(req.url.endsWith('.svg')) res.writeHead(200, {'Content-Type': 'image/svg+xml'});


			// res.writeHead(200, {'Content-Type': 'text/css'});
			res.write(data);
			res.end();
		});
	}


	if(req.url.startsWith('/flag')){
		let flagname = req.url.split('/flag/')[1];
		fs.readFile('./flags/' + flagname, (err, data) => {
			if(err) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({error: err.toString()}));
                res.end();
                return;
            }
			// send png
			res.writeHead(200, {'Content-Type': 'image/png'});
			res.write(data);
			res.end();
		})
	}

    if(req.url === "/api/newgame"){
			fs.readdir('./flags', (err, files) => {
				if(err) throw err;
				let randomFlag = files[Math.floor(Math.random() * files.length)];
				// convert flag to base64
				fs.readFile('./flags/' + randomFlag, (err, data) => {
					if(err) throw err;
					let base64Flag = Buffer.from(data).toString('base64');
					// send response
					fs.readFile('./frontend/index.html', (err, data) => {
						if(err) throw err;
						res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify({img: 'data:image/png;base64,' + base64Flag, name: btoa(randomFlag.split('.')[0])}));
						res.end();
					});
				});
			});
    }


});


server.listen(3000, () => {
	  console.log('The server is up and running on http://localhost:3000');
});
