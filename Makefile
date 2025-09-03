
run:
	npm start

pushdev:
	git push origin --force `git symbolic-ref --short HEAD`:dev

kill:
	pkill -9 -f workerd

setup:
	npm run setup