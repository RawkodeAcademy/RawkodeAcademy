use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct GraphQLResponse<T> {
    pub data: Option<T>,
    pub errors: Option<Vec<GraphQLError>>,
}

#[derive(Debug, Deserialize)]
pub struct GraphQLError {
    #[allow(dead_code)]
    pub message: String,
}

pub struct GraphQLClient {
    client: Client,
    endpoint: String,
}

impl GraphQLClient {
    pub fn new(endpoint: String) -> Self {
        Self {
            client: Client::new(),
            endpoint,
        }
    }

    pub async fn query<T, V>(&self, query: &str, variables: Option<V>) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        V: Serialize,
    {
        let body = json!({
            "query": query,
            "variables": variables
        });

        let response = self
            .client
            .post(&self.endpoint)
            .json(&body)
            .send()
            .await?;

        let graphql_response: GraphQLResponse<T> = response.json().await?;

        if let Some(errors) = graphql_response.errors {
            anyhow::bail!("GraphQL errors: {:?}", errors);
        }

        graphql_response
            .data
            .ok_or_else(|| anyhow::anyhow!("No data in GraphQL response"))
    }
}