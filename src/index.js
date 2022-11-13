export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		const uri = url.pathname.slice(1)
		const objectName = url.pathname.slice(1)

		const options = {
			limit: 500,
			include: ['customMetadata'],
		}

		// Check if vising /api, list all the files
		if (uri == "api") {
			const listed = await env.dl_halo_run.list(options);

			const listed_objects = listed['objects'];
			for (const listed_object of listed_objects) {
				delete listed_object.customMetadata;
				delete listed_object.httpMetadata;
				delete listed_object.version;
				delete listed_object.httpEtag;
				delete listed_object.etag;
			}
	
			return new Response(JSON.stringify(listed_objects), {
				headers: {
					'content-type': 'application/json; charset=UTF-8',
				}
			});
		} else {
			// return the file
			const file = await env.dl_halo_run.get(objectName);
			if (!file) {
				return new Response('File not found', { status: 404 })
			}
			const headers = new Headers()
			file.writeHttpMetadata(headers)
			headers.set('etag', file.httpEtag)
			return new Response(file.body, {
				headers
			})
		}
	},
	async scheduled(event, env, ctx) {
		const HALO_API_URL = "https://api.github.com/repos/halo-dev/halo/releases?per_page=100"

		const headers = {
			'Content-Type': 'application/json;charset=UTF-8',
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:106.0) Gecko/20100101 Firefox/106.0',
		}
		const halo_api_url = HALO_API_URL
		const release_data = await fetch(halo_api_url, { headers });
		const release_json = await release_data.json();

		let download_url_list = release_json.map((release) => {
			return release.assets.map((asset) => {
				return asset.browser_download_url
			})
		}).flat()

		for (const download_url of download_url_list) {
			const filename = download_url.substring(download_url.lastIndexOf('/')+1);

			// Only download file with jar extension
			if (filename.endsWith('.jar')) {

				let download_filname = ""
				if (filename.includes('beta') || filename.includes('alpha')) {
					download_filname = "prerelease/" + filename;
				} else {
					download_filname = "release/" + filename;
				}

				// Check if exist in R2
				console.log("Checking if exist in R2");
				const check_file = await env.dl_halo_run.get(download_filname);
				console.log("Check file", check_file);
				if (!check_file) {
					console.log('Downloading file' + filename);
					const response = await fetch(download_url);
					await env.dl_halo_run.put(download_filname, response.body);
				} else{
					console.log('File already exist in R2 ' + filename);
				}
			}

		};
		return new Response(JSON.stringify({for_download_url_list}));
	},
};