// A generated module for GcpSecrets functions

package main

import (
	"context"
	"dagger/gcp-secrets/internal/dagger"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"google.golang.org/api/option"
)

type GcpSecrets struct{}

// Get a single secret from the Google Secret Manager with latest version
// example: dagger call get-secret --project-id=project-id --secret-name=secret-name --version=latest --credential=path-to-Servcie-account-file
func (m *GcpSecrets) GetSecret(projectID string, secretName string,
	//+optional
	// +default="latest"
	version string, credential *dagger.File) (string, error) {

	// Create the client.
	ctx := context.Background()

	json, err := credential.Contents(ctx)
	if err != nil {
		return "", err
	}
	b := []byte(json)
	client, err := secretmanager.NewClient(ctx, option.WithCredentialsJSON(b))
	if err != nil {
		return "", err
	}
	defer client.Close()

	// Create the request to create the secret.
	secretName = "projects/" + projectID + "/secrets/" + secretName + "/versions/" + version

	// Build the request.
	accessRequest := &secretmanagerpb.AccessSecretVersionRequest{
		Name: secretName,
	}

	// Call the API.
	result, err := client.AccessSecretVersion(ctx, accessRequest)
	if err != nil {
		return "", err
	}

	// Print the secret payload.
	return string(result.Payload.Data), nil

}

// Get multiple secrets from the Google Secret Manager with the latest version, if we don't provide the version it will return the latest version
// example: dagger call get-secrets --project-id=project-id --secret-names=secret-name1,secret-name2 --credential=path-to-Servcie-account-file
func (m *GcpSecrets) GetSecrets(projectID string, secretNames []string,
	//+optional
	// +default="latest"
	version string,
	credential *dagger.File) ([]string, error) {

	// Create the client.
	ctx := context.Background()

	var output []string

	json, err := credential.Contents(ctx)
	if err != nil {
		return nil, err
	}
	b := []byte(json)
	client, err := secretmanager.NewClient(ctx, option.WithCredentialsJSON(b))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	for _, secretName := range secretNames {

		// Create the request to create the secret.
		secretName = "projects/" + projectID + "/secrets/" + secretName + "/versions/latest"

		// Build the request.
		accessRequest := &secretmanagerpb.AccessSecretVersionRequest{
			Name: secretName,
		}

		// Call the API.
		result, err := client.AccessSecretVersion(ctx, accessRequest)
		if err != nil {
			return output, err
		}

		output = append(output, string(result.Payload.Data))

		// Print the secret payload.
	}

	return output, nil

}

//Passing the credentials via the secret

func (m *GcpSecrets) GetSecretViaSecret(projectID string, secretName string,
	//+optional
	// +default="latest"
	version string, credential *dagger.Secret) (string, error) {

	// Create the client.
	ctx := context.Background()

	json, err := credential.Plaintext(ctx)
	if err != nil {
		return "", err
	}
	b := []byte(json)
	client, err := secretmanager.NewClient(ctx, option.WithCredentialsJSON(b))
	if err != nil {
		return "", err
	}
	defer client.Close()

	// Create the request to create the secret.
	secretName = "projects/" + projectID + "/secrets/" + secretName + "/versions/" + version

	// Build the request.
	accessRequest := &secretmanagerpb.AccessSecretVersionRequest{
		Name: secretName,
	}

	// Call the API.
	result, err := client.AccessSecretVersion(ctx, accessRequest)
	if err != nil {
		return "", err
	}

	// Print the secret payload.
	return string(result.Payload.Data), nil

}
