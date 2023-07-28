


let sourceImage = "";
let sourceflag = "";
let won = false;
let tries = 0;
let accumulatedMatchingData;
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;



function pixelColorDifference(pixel1, pixel2) {
	// Calculate the difference between each color component (red, green, blue)
	const rDiff = Math.abs(pixel1[0] - pixel2[0]);
	const gDiff = Math.abs(pixel1[1] - pixel2[1]);
	const bDiff = Math.abs(pixel1[2] - pixel2[2]);

	// Return the total color difference (sum of differences)
	let totalDiff = rDiff + gDiff + bDiff;
	return totalDiff;
}

function compareImages(image1, image2) {
	let newcanvas = document.createElement('canvas');
	newcanvas.width = image1.width;
	newcanvas.height = image1.height;
	let newctx = newcanvas.getContext('2d');

	// Get the pixel data for image1
	newctx.drawImage(image1, 0, 0);
	const imageData1 = newctx.getImageData(0, 0, newcanvas.width, newcanvas.height);
	const pixels1 = imageData1.data;

	newctx.clearRect(0, 0, newcanvas.width, newcanvas.height);
	newctx.drawImage(image2, 0, 0);

	// Get the pixel data for image2
	const imageData2 = newctx.getImageData(0, 0, newcanvas.width, newcanvas.height);
	const pixels2 = imageData2.data;

	// Create a new image data to store the matching parts
	const matchingImageData = newctx.createImageData(newcanvas.width, newcanvas.height);
	const matchingPixels = matchingImageData.data;

	// Compare the pixel data and store the matching parts in matchingPixels
	const similarityThreshold = 160; // You can adjust this value based on your preference

	// Compare the pixel data and store the matching parts in matchingPixels
	let allSame = true;
	for (let i = 0; i < pixels1.length; i += 4) {
		const pixel1 = [pixels1[i], pixels1[i + 1], pixels1[i + 2]];
		const pixel2 = [pixels2[i], pixels2[i + 1], pixels2[i + 2]];

		// Check if the color difference is within the similarity threshold
		if (pixelColorDifference(pixel1, pixel2) <= similarityThreshold) {
			matchingPixels[i] = pixels1[i];
			matchingPixels[i + 1] = pixels1[i + 1];
			matchingPixels[i + 2] = pixels1[i + 2];
			matchingPixels[i + 3] = 255;
		}else{
			allSame = false;
		}
	}

	matchingImageData.data = matchingPixels;

	// If this is the first comparison, set accumulatedMatchingData to the matchingImageData
	if (!accumulatedMatchingData) {
		accumulatedMatchingData = matchingImageData;
	} else {
		// Combine the current matchingImageData with the accumulatedMatchingData
		for (let i = 0; i < accumulatedMatchingData.data.length; i++) {
			accumulatedMatchingData.data[i] |= matchingImageData.data[i];
		}
	}

	if(allSame){
        Swal.fire({
            text: "You have found the flag! It was " + sourceflag.name + ".",
            icon: "success",
            title: "Congratulations!",
            imageUrl: sourceImage,
        })
        won = true;

        score++;
        if(score > highscore){
            highscore = score;
            localStorage.setItem("highscore", highscore);
        }
        
        document.getElementById('score').innerHTML = score
        document.getElementById('highscore').innerHTML = highscore
        document.getElementById('restart_button').innerHTML = 'New Game'
	}

}



function setSource(source, name) {
	sourceImage = source;
    let flag = flags_names.find(x => x.code.toLowerCase() == name.toLowerCase())
    if(!flag){
        console.log("[Error] Flag not found");
        location.reload();
        return;
    }
    sourceflag = flag;


	let canvas = document.getElementById('canvas');
	const image = new Image();
	image.src = source;
	image.onload = function() {
		canvas.width = image.width;
		canvas.height = image.height;
	}
}



function loadAndCompareImages(image) {
	const image1 = new Image();
	const image2 = new Image();

	image1.onload = function() {
		image2.src = image; // Load the next image
		image2.onload = function() {
			// Compare the images and add matching parts to the accumulated data
			compareImages(image1, image2);

			// After comparing all images, draw the accumulated matching parts onto the canvas
			const canvas = document.getElementById('canvas');
			const ctx = canvas.getContext('2d');
			ctx.putImageData(accumulatedMatchingData, 0, 0);
		};
	};

	image1.src = sourceImage; // Use the first image as the source for comparison
}

function restart(){
    tries = 0;
    if(!won){
        score = 0;
    }
    document.getElementById('restart_button').innerHTML = 'Reset'
    won = false;
    accumulatedMatchingData = undefined;
    document.getElementById("canvas").getContext("2d").clearRect(0, 0, document.getElementById("canvas").width, document.getElementById("canvas").height);

    fetch('/api/newgame').then(res => res.json()).then(data => {
        setSource(data.img, atob(data.name));
        document.getElementById("score").innerHTML = score;
        document.getElementById("guesses_wrapper").innerHTML = `
        <div class="former_guess">&nbsp;</div>
        <div class="former_guess">&nbsp;</div>
        <div class="former_guess">&nbsp;</div>
        <div class="former_guess">&nbsp;</div>
        <div class="former_guess">&nbsp;</div>
        <div class="former_guess">&nbsp;</div>`;
    });

}

function checkFlag(guess){

    if(won) return;

	// try to find guess in flags_names
	// if found, loadAndCompareImages(`/flag/${guess}.png`)
	// else, alert("Not a valid flag")

	guess = guess.toLowerCase();
	let guessname = guess;
	let found = false;
	for(let i = 0; i < flags_names.length; i++){
		if(flags_names[i].name.toLowerCase() == guess){
			guess = flags_names[i].code;
			guessname = flags_names[i].name;
			found = true;
			break;
		}
	}
	
	if(!found){
		Swal.fire({
            text: "Not a valid flag",
            icon: "error",
            title: "Oops!"
        })
		return;
	}

	tries++;

	if(tries > 6){
        Swal.fire({
            text: "You have exceeded the number of tries. The flag we were looking for was " + sourceflag.name,
            icon: "error",
            title: "Oops!"
        })
		return;
	}

	document.getElementsByClassName("former_guess")[tries-1].innerHTML = '<span class="guess_name">' + guessname + '</span> | <img src="/flag/' + guess + '.png" class="guess_flag" alt="Guess Flag">';

	loadAndCompareImages(`/flag/${guess}.png`)
}

const flags_names = [
	{code:'AF',name: 'Afghanistan'},
	{code:'AX',name: 'Aland Islands'},
	{code:'AL',name: 'Albania'},
	{code:'DZ',name: 'Algeria'},
	{code:'AS',name: 'American Samoa'},
	{code:'AD',name: 'Andorra'},
	{code:'AO',name: 'Angola'},
	{code:'AI',name: 'Anguilla'},
	{code:'AQ',name: 'Antarctica'},
	{code:'AG',name: 'Antigua And Barbuda'},
	{code:'AR',name: 'Argentina'},
	{code:'AM',name: 'Armenia'},
	{code:'AW',name: 'Aruba'},
	{code:'AU',name: 'Australia'},
	{code:'AT',name: 'Austria'},
	{code:'AZ',name: 'Azerbaijan'},
	{code:'BS',name: 'Bahamas'},
	{code:'BH',name: 'Bahrain'},
	{code:'BD',name: 'Bangladesh'},
	{code:'BB',name: 'Barbados'},
	{code:'BY',name: 'Belarus'},
	{code:'BE',name: 'Belgium'},
	{code:'BZ',name: 'Belize'},
	{code:'BJ',name: 'Benin'},
	{code:'BM',name: 'Bermuda'},
	{code:'BT',name: 'Bhutan'},
	{code:'BO',name: 'Bolivia'},
	{code:'BA',name: 'Bosnia And Herzegovina'},
	{code:'BW',name: 'Botswana'},
	{code:'BV',name: 'Bouvet Island'},
	{code:'BR',name: 'Brazil'},
	{code:'IO',name: 'British Indian Ocean Territory'},
	{code:'BN',name: 'Brunei Darussalam'},
	{code:'BG',name: 'Bulgaria'},
	{code:'BF',name: 'Burkina Faso'},
	{code:'BI',name: 'Burundi'},
	{code:'KH',name: 'Cambodia'},
	{code:'CM',name: 'Cameroon'},
	{code:'CA',name: 'Canada'},
	{code:'CV',name: 'Cape Verde'},
	{code:'KY',name: 'Cayman Islands'},
	{code:'CF',name: 'Central African Republic'},
	{code:'TD',name: 'Chad'},
	{code:'CL',name: 'Chile'},
	{code:'CN',name: 'China'},
	{code:'CX',name: 'Christmas Island'},
	{code:'CC',name: 'Cocos (Keeling) Islands'},
	{code:'CO',name: 'Colombia'},
	{code:'KM',name: 'Comoros'},
	{code:'CG',name: 'Congo'},
	{code:'CD',name: 'Congo}, Democratic Republic'},
	{code:'CK',name: 'Cook Islands'},
	{code:'CR',name: 'Costa Rica'},
	{code:'CI',name: 'Cote D\'Ivoire'},
	{code:'HR',name: 'Croatia'},
	{code:'CU',name: 'Cuba'},
	{code:'CY',name: 'Cyprus'},
	{code:'CZ',name: 'Czech Republic'},
	{code:'DK',name: 'Denmark'},
	{code:'DJ',name: 'Djibouti'},
	{code:'DM',name: 'Dominica'},
	{code:'DO',name: 'Dominican Republic'},
	{code:'EC',name: 'Ecuador'},
	{code:'EG',name: 'Egypt'},
	{code:'SV',name: 'El Salvador'},
	{code:'GQ',name: 'Equatorial Guinea'},
	{code:'ER',name: 'Eritrea'},
	{code:'EE',name: 'Estonia'},
	{code:'ET',name: 'Ethiopia'},
	{code:'FK',name: 'Falkland Islands (Malvinas)'},
	{code:'FO',name: 'Faroe Islands'},
	{code:'FJ',name: 'Fiji'},
	{code:'FI',name: 'Finland'},
	{code:'FR',name: 'France'},
	{code:'GF',name: 'French Guiana'},
	{code:'PF',name: 'French Polynesia'},
	{code:'TF',name: 'French Southern Territories'},
	{code:'GA',name: 'Gabon'},
	{code:'GM',name: 'Gambia'},
	{code:'GE',name: 'Georgia'},
	{code:'DE',name: 'Germany'},
	{code:'GH',name: 'Ghana'},
	{code:'GI',name: 'Gibraltar'},
	{code:'GR',name: 'Greece'},
	{code:'GL',name: 'Greenland'},
	{code:'GD',name: 'Grenada'},
	{code:'GP',name: 'Guadeloupe'},
	{code:'GU',name: 'Guam'},
	{code:'GT',name: 'Guatemala'},
	{code:'GG',name: 'Guernsey'},
	{code:'GN',name: 'Guinea'},
	{code:'GW',name: 'Guinea-Bissau'},
	{code:'GY',name: 'Guyana'},
	{code:'HT',name: 'Haiti'},
	{code:'HM',name: 'Heard Island & Mcdonald Islands'},
	{code:'VA',name: 'Holy See (Vatican City State)'},
	{code:'HN',name: 'Honduras'},
	{code:'HK',name: 'Hong Kong'},
	{code:'HU',name: 'Hungary'},
	{code:'IS',name: 'Iceland'},
	{code:'IN',name: 'India'},
	{code:'ID',name: 'Indonesia'},
	{code:'IR',name: 'Iran'},
	{code:'IQ',name: 'Iraq'},
	{code:'IE',name: 'Ireland'},
	{code:'IM',name: 'Isle Of Man'},
	{code:'IL',name: 'Israel'},
	{code:'IT',name: 'Italy'},
	{code:'JM',name: 'Jamaica'},
	{code:'JP',name: 'Japan'},
	{code:'JE',name: 'Jersey'},
	{code:'JO',name: 'Jordan'},
	{code:'KZ',name: 'Kazakhstan'},
	{code:'KE',name: 'Kenya'},
	{code:'KI',name: 'Kiribati'},
	{code:'KR',name: 'Korea'},
	{code:'KW',name: 'Kuwait'},
	{code:'KG',name: 'Kyrgyzstan'},
	{code:'LA',name: 'Lao People\'s Democratic Republic'},
	{code:'LV',name: 'Latvia'},
	{code:'LB',name: 'Lebanon'},
	{code:'LS',name: 'Lesotho'},
	{code:'LR',name: 'Liberia'},
	{code:'LY',name: 'Libyan Arab Jamahiriya'},
	{code:'LI',name: 'Liechtenstein'},
	{code:'LT',name: 'Lithuania'},
	{code:'LU',name: 'Luxembourg'},
	{code:'MO',name: 'Macao'},
	{code:'MK',name: 'Macedonia'},
	{code:'MG',name: 'Madagascar'},
	{code:'MW',name: 'Malawi'},
	{code:'MY',name: 'Malaysia'},
	{code:'MV',name: 'Maldives'},
	{code:'ML',name: 'Mali'},
	{code:'MT',name: 'Malta'},
	{code:'MH',name: 'Marshall Islands'},
	{code:'MQ',name: 'Martinique'},
	{code:'MR',name: 'Mauritania'},
	{code:'MU',name: 'Mauritius'},
	{code:'YT',name: 'Mayotte'},
	{code:'MX',name: 'Mexico'},
	{code:'FM',name: 'Micronesia}, Federated States Of'},
	{code:'MD',name: 'Moldova'},
	{code:'MC',name: 'Monaco'},
	{code:'MN',name: 'Mongolia'},
	{code:'ME',name: 'Montenegro'},
	{code:'MS',name: 'Montserrat'},
	{code:'MA',name: 'Morocco'},
	{code:'MZ',name: 'Mozambique'},
	{code:'MM',name: 'Myanmar'},
	{code:'NA',name: 'Namibia'},
	{code:'NR',name: 'Nauru'},
	{code:'NP',name: 'Nepal'},
	{code:'NL',name: 'Netherlands'},
	{code:'AN',name: 'Netherlands Antilles'},
	{code:'NC',name: 'New Caledonia'},
	{code:'NZ',name: 'New Zealand'},
	{code:'NI',name: 'Nicaragua'},
	{code:'NE',name: 'Niger'},
	{code:'NG',name: 'Nigeria'},
	{code:'NU',name: 'Niue'},
	{code:'NF',name: 'Norfolk Island'},
	{code:'MP',name: 'Northern Mariana Islands'},
	{code:'NO',name: 'Norway'},
	{code:'OM',name: 'Oman'},
	{code:'PK',name: 'Pakistan'},
	{code:'PW',name: 'Palau'},
	{code:'PS',name: 'Palestinian Territory}, Occupied'},
	{code:'PA',name: 'Panama'},
	{code:'PG',name: 'Papua New Guinea'},
	{code:'PY',name: 'Paraguay'},
	{code:'PE',name: 'Peru'},
	{code:'PH',name: 'Philippines'},
	{code:'PN',name: 'Pitcairn'},
	{code:'PL',name: 'Poland'},
	{code:'PT',name: 'Portugal'},
	{code:'PR',name: 'Puerto Rico'},
	{code:'QA',name: 'Qatar'},
	{code:'RE',name: 'Reunion'},
	{code:'RO',name: 'Romania'},
	{code:'RU',name: 'Russian Federation'},
	{code:'RW',name: 'Rwanda'},
	{code:'BL',name: 'Saint Barthelemy'},
	{code:'SH',name: 'Saint Helena'},
	{code:'KN',name: 'Saint Kitts And Nevis'},
	{code:'LC',name: 'Saint Lucia'},
	{code:'MF',name: 'Saint Martin'},
	{code:'PM',name: 'Saint Pierre And Miquelon'},
	{code:'VC',name: 'Saint Vincent And Grenadines'},
	{code:'WS',name: 'Samoa'},
	{code:'SM',name: 'San Marino'},
	{code:'ST',name: 'Sao Tome And Principe'},
	{code:'SA',name: 'Saudi Arabia'},
	{code:'SN',name: 'Senegal'},
	{code:'RS',name: 'Serbia'},
	{code:'SC',name: 'Seychelles'},
	{code:'SL',name: 'Sierra Leone'},
	{code:'SG',name: 'Singapore'},
	{code:'SK',name: 'Slovakia'},
	{code:'SI',name: 'Slovenia'},
	{code:'SB',name: 'Solomon Islands'},
	{code:'SO',name: 'Somalia'},
	{code:'ZA',name: 'South Africa'},
	{code:'GS',name: 'South Georgia And Sandwich Isl.'},
	{code:'ES',name: 'Spain'},
	{code:'LK',name: 'Sri Lanka'},
	{code:'SD',name: 'Sudan'},
	{code:'SR',name: 'Suriname'},
	{code:'SJ',name: 'Svalbard And Jan Mayen'},
	{code:'SZ',name: 'Swaziland'},
	{code:'SE',name: 'Sweden'},
	{code:'CH',name: 'Switzerland'},
	{code:'SY',name: 'Syrian Arab Republic'},
	{code:'TW',name: 'Taiwan'},
	{code:'TJ',name: 'Tajikistan'},
	{code:'TZ',name: 'Tanzania'},
	{code:'TH',name: 'Thailand'},
	{code:'TL',name: 'Timor-Leste'},
	{code:'TG',name: 'Togo'},
	{code:'TK',name: 'Tokelau'},
	{code:'TO',name: 'Tonga'},
	{code:'TT',name: 'Trinidad And Tobago'},
	{code:'TN',name: 'Tunisia'},
	{code:'TR',name: 'Turkey'},
	{code:'TM',name: 'Turkmenistan'},
	{code:'TC',name: 'Turks And Caicos Islands'},
	{code:'TV',name: 'Tuvalu'},
	{code:'UG',name: 'Uganda'},
	{code:'UA',name: 'Ukraine'},
	{code:'AE',name: 'United Arab Emirates'},
	{code:'GB',name: 'United Kingdom'},
	{code:'US',name: 'United States'},
	{code:'UM',name: 'United States Outlying Islands'},
	{code:'UY',name: 'Uruguay'},
	{code:'UZ',name: 'Uzbekistan'},
	{code:'VU',name: 'Vanuatu'},
	{code:'VE',name: 'Venezuela'},
	{code:'VN',name: 'Vietnam'},
	{code:'VG',name: 'Virgin Islands}, British'},
	{code:'VI',name: 'Virgin Islands}, U.S.'},
	{code:'WF',name: 'Wallis And Futuna'},
	{code:'EH',name: 'Western Sahara'},
	{code:'YE',name: 'Yemen'},
	{code:'ZM',name: 'Zambia'},
	{code:'ZW',name: 'Zimbabwe'}
	];