curl https://201j3n9npdrybn7f2z8tmnj8rds.env.us.restate.cloud:8080/transcription/transcribeVideoById \
	-H "Authorization: Bearer $RESTATE_API_KEY" \
	-H 'idempotency-key: ad5472esg4dsg525dssdfa5loe' \
	--json '{ "videoId": "h0e270cxlhdgnr6x20mcno3d", "language": "en"}'
