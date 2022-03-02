_schema: {
	name:      "Technology"
	namespace: "schema.rawkode.academy"
}

#Technology: {
	_dataset: {
		plural: "technologies"
		supportedExtensions: ["yaml", "yml", "md", "mdx"]
	}

	name: string @template("Your Name")

	links?: [...#Url]

	body?: string
}

#Url: {
	name: string @template("name")
	url:  string @template("https://some_url")
}
