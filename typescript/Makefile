.PHONY: enter

enter:
	docker run -it --rm --name my_js_sandbox_node \
           -v `pwd`:/usr/src/app \
           -w /usr/src/app \
           node:18.18 \
           bash -c "npm i -g typescript && bash"
