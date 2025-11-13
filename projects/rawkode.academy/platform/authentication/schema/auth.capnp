@0x9f8a7b6c5d4e3f2a;

# Authentication Service RPC Interface using Cap'n Proto

struct User {
  id @0 :Text;
  email @1 :Text;
  name @2 :Text;
  image @3 :Text;
  emailVerified @4 :Bool;
  createdAt @5 :Int64;  # Unix timestamp
  updatedAt @6 :Int64;  # Unix timestamp
}

struct Session {
  id @0 :Text;
  userId @1 :Text;
  expiresAt @2 :Int64;  # Unix timestamp
  ipAddress @3 :Text;
  userAgent @4 :Text;
}

struct AuthResponse {
  success @0 :Bool;
  user @1 :User;
  session @2 :Session;
  error @3 :Text;
}

interface AuthenticationService {
  # Verify a session token and return user info
  verifySession @0 (sessionToken :Text) -> (result :AuthResponse);
  
  # Get user by ID
  getUser @1 (userId :Text) -> (user :User);
  
  # Get user by email
  getUserByEmail @2 (email :Text) -> (user :User);
  
  # List sessions for a user
  listUserSessions @3 (userId :Text) -> (sessions :List(Session));
  
  # Revoke a session
  revokeSession @4 (sessionId :Text) -> (success :Bool);
  
  # Validate passkey credential
  validatePasskey @5 (userId :Text, credentialId :Text) -> (valid :Bool);
}
