install:
	npm install

run: install
	npx concurrently "npx nodemon --watch functions --watch public --exec 'npx wrangler pages functions build --outdir=./dist/'"  "npx wrangler dev --env dev --live-reload"

pushdev:
	git push origin --force `git symbolic-ref --short HEAD`:dev

kill:
	pkill -9 -f workerd
	