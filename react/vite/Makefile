.PHONY: enter

enter:
	docker run -it --rm --name ma_react_node \
           -v `pwd`:/usr/src/app \
           -w /usr/src/app \
           -p 3001:3001 \
           node:18.18 \
           bash
           # bash -c "npm i -g serve && bash"
