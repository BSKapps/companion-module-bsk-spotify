const https = require('https')
const http = require('http')
const { Jimp } = require('jimp')

const BUTTON_SIZE = 72

function fetchUrl(url) {
	return new Promise((resolve, reject) => {
		let client = url.startsWith('https') ? https : http
		client.get(url, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				return fetchUrl(res.headers.location).then(resolve).catch(reject)
			}
			let chunks = []
			res.on('data', (d) => chunks.push(d))
			res.on('end', () => resolve(Buffer.concat(chunks)))
			res.on('error', reject)
		}).on('error', reject)
	})
}

async function processAlbumArt(url) {
	let buf = await fetchUrl(url)
	let img = await Jimp.read(buf)

	// Resize to largest grid we support (3x3 = 216x216) keeping quality
	let full = img.clone().resize({ w: BUTTON_SIZE * 3, h: BUTTON_SIZE * 3 })

	let slices = {}

	// 1x1 - full image at button size
	let img1 = img.clone().resize({ w: BUTTON_SIZE, h: BUTTON_SIZE })
	slices['1x1'] = await img1.getBase64('image/png')

	// 2x2 slices
	for (let r = 0; r < 2; r++) {
		for (let c = 0; c < 2; c++) {
			let slice = full.clone()
				.crop({ x: c * BUTTON_SIZE, y: r * BUTTON_SIZE, w: BUTTON_SIZE, h: BUTTON_SIZE })
			slices[`2x2_${r}_${c}`] = await slice.getBase64('image/png')
		}
	}

	// 3x3 slices
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 3; c++) {
			let slice = full.clone()
				.crop({ x: c * BUTTON_SIZE, y: r * BUTTON_SIZE, w: BUTTON_SIZE, h: BUTTON_SIZE })
			slices[`3x3_${r}_${c}`] = await slice.getBase64('image/png')
		}
	}

	return slices
}

module.exports = { processAlbumArt }
