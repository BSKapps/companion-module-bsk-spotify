const https = require('https')
const http = require('http')
const { Jimp } = require('jimp')

const BUTTON_SIZE = 72

function fetchUrl(url, depth = 0) {
	return new Promise((resolve, reject) => {
		if (depth > 5) return reject(new Error('Too many redirects'))
		let client = url.startsWith('https') ? https : http
		let req = client.get(url, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				res.resume()
				return fetchUrl(res.headers.location, depth + 1).then(resolve).catch(reject)
			}
			if (res.statusCode >= 400) {
				res.resume()
				return reject(new Error(`Album art HTTP ${res.statusCode}`))
			}
			let chunks = []
			res.on('data', (d) => chunks.push(d))
			res.on('end', () => resolve(Buffer.concat(chunks)))
			res.on('error', reject)
		})
		req.on('error', reject)
		req.setTimeout(8000, () => req.destroy(new Error('Album art request timeout')))
	})
}

async function processAlbumArt(url) {
	let buf = await fetchUrl(url)
	let img = await Jimp.read(buf)

	let slices = {}

	let img1 = img.clone().resize({ w: BUTTON_SIZE, h: BUTTON_SIZE })
	slices['1x1'] = await img1.getBase64('image/png')

	let img2 = img.clone().resize({ w: BUTTON_SIZE * 2, h: BUTTON_SIZE * 2 })
	for (let r = 0; r < 2; r++) {
		for (let c = 0; c < 2; c++) {
			let slice = img2.clone()
				.crop({ x: c * BUTTON_SIZE, y: r * BUTTON_SIZE, w: BUTTON_SIZE, h: BUTTON_SIZE })
			slices[`2x2_${r}_${c}`] = await slice.getBase64('image/png')
		}
	}

	let img3 = img.clone().resize({ w: BUTTON_SIZE * 3, h: BUTTON_SIZE * 3 })
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 3; c++) {
			let slice = img3.clone()
				.crop({ x: c * BUTTON_SIZE, y: r * BUTTON_SIZE, w: BUTTON_SIZE, h: BUTTON_SIZE })
			slices[`3x3_${r}_${c}`] = await slice.getBase64('image/png')
		}
	}

	return slices
}

module.exports = { processAlbumArt }
