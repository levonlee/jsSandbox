.PHONY: enter

enter:
	docker run -it --rm --name my_js_sandbox_node \
           -v `pwd`:/usr/src/app \
           -w /usr/src/app \
           -p 3000:3000 \
           node:18.18 \
           bash
