cwd  := $(shell pwd)

get-prefixes:
	node ./prepare.js pins/

prepare:
	node ./prepare.js \
		pins/ \
		"Back yard,Living room,Stairs design,Bedroom,Home office,Kitchen design,Bathroom,House exterior,Home library,Gardening" \
		./architecture/

prepare-win:
	node .\prepare.js `
		pins\ `
		"Back yard,Living room,Stairs design,Bedroom,Home office,Kitchen design,Bathroom,House exterior,Home library,Gardening" `
		.\architecture\
