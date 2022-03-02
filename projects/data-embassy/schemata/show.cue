_schema: {
	name:      "Show"
	namespace: "schema.rawkode.academy"
}

#Show: {
	_dataset: {
		plural: "shows"
		supportedExtensions: ["yaml", "yml", "md", "mdx"]
	}

	name:     string @template("Show Name")
	host:     string @relationship(Person)
	hashtag?: string @template("hashtag")
}
