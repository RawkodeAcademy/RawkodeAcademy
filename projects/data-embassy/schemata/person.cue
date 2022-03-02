_schema: {
	name:      "Person"
	namespace: "schema.rawkode.academy"
}

#Person: {
	_dataset: {
		plural: "people"
		supportedExtensions: ["yaml", "yml", "md", "mdx"]
	}

	name:   string @template("Your Name")
	email?: string @template("me@example.com")

	github?:  string
	twitter?: string
	links?: [...#Url]
}

#Url: {
	name: string @template("name")
	url:  string @template("https://some_url")
}
