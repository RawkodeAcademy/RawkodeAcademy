import { ManagedZone } from "../domains";

export const rawkodeCom = new ManagedZone("rawkode-com", {
  domain: "rawkode.com",
  description: "Managed by Pulumi",
})
  .enableGSuite()
  .addRecord({
    name: "google._domainkey",
    type: "TXT",
    ttl: 300,
    values: [
      "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiwh7x7EfNHJ+C/SD9nLT2G5ZkGpfgEnVziGaKA2EsoGOmFzv2VyYK1Bf5HTXSB8uSXWGhNSn0961STxDWv+Y966Cb9lqhwb53xpz0lV2RifkNmVUCk7IJW6TbDaFRvP89TaW/F5Z3OwZEJ7tZ1gsdMs0cj2ro1mGRuFU7BcNyHbQwGAfBap9U/eoG4JyD3kAnncRDJKRhbku91tPriMvmMwOrppti/Cp9ntUWppsnCCQNwegLM/uo9orWHteAXFYxC6kjwOVXSXQ8GddpwEQWTZtZtrYXD0QoZspDOeUrmoGKGu2hgjl1mvzALFSo8VV5kOyGLbK4oYA15k5F18vWwIDAQAB",
    ],
  });
